import "halfmoon/css/halfmoon-variables.min.css";
import "choices.js/public/assets/styles/choices.min.css";
import "./style.css";

import * as userFacade from "./scripts/userFacade";

import { parse_str } from "locutus/php/strings";
import Choices from "choices.js";

import halfmoon from "halfmoon";
window.halfmoon = halfmoon;
halfmoon.onDOMContentLoaded();

/**
 *
 * Styles and stuff...
 *
 */

function userRow(user) {
	return `
    <tr>
        <td>${user.id}</td>
        <td>${user.firstname}</td>
        <td>${user.lastname}</td>
        <td><a class="phoneObject" href="#phoneModal" data-id="${user.id}">Se numre</a></td>
        <td><a class="addressObject" href="#addressModal" data-id="${user.id}">Se adresse</a></td>
        <td>${user.email}</td>
        <td><a class="hobbyObject" href="#hobbyModal" data-id="${user.id}">Se hobbyer</td>
        <td>
            <div class="text-nowrap">
                <a class="btn prompt-edit" data-id="${user.id}" type="button">Edit</a>
                <a data-id="${user.id}" class="btn btn-danger ml-10 prompt-delete" type="button">Delete</a>
            </div>
        </td>
    </tr>
    `;
}

async function displayUsers() {
	const $utc = document.getElementById("users_table").querySelector("tbody");
	try {
		const users = await userFacade.getUsers();
		const rows = Array.isArray(users) ? users.map((user) => userRow(user)).join("") : "<tr><td>No users found...</td></tr>";
		$utc.innerHTML = rows;
		document.getElementById("totalUsersFromSearch").innerText = users.length;
	} catch (err) {
		displayError(err);
	}
}

// Initial load, display our users.
displayUsers();
populateHobbyChoices();

async function populateHobbyChoices() {
	const hobbies = (await userFacade.getAllHobbies()).map((ho) => {
		return { value: ho.name, label: ho.name };
	});
	window.cuChoices = new Choices(document.getElementById("cu_choices"), {
		choices: hobbies,
		itemSelectText: "Klik for at vælge",
	});

	window.euChoices = new Choices(document.getElementById("eu_choices"), {
		choices: hobbies,
		itemSelectText: "Klik for at vælge",
	});

	window.duChoices = new Choices(document.getElementById("du_choices"), {
		choices: hobbies,
		itemSelectText: "Klik for at vælge",
	});
}

/**
 *
 * Repository and Event Workings.
 *
 */

// All our events do almost the exact same thing...
// 1) Builds a json object from formdata and sends to our user repository.
// 2) Reset the form and refresh the user table -- except if an error happened.
// So having one function to manage all events seems more logical here.
async function handleFormEvent(event, $form, requestType) {
	event.preventDefault();
	const user = formToJSON($form);

	// Disable submit button to prevent accidental double request.
	const $submit = $form.querySelector("input[type='submit']");
	$submit.disabled = true;

	try {
		let userResponse;
		let pastTense; // Just for nicer UI
		// Our 3 types of requests...
		switch (requestType) {
			case "create":
				userResponse = await userFacade.addUser(user);
				pastTense = "created";
				break;
			case "edit":
				userResponse = await userFacade.editUser(user.id, user);
				pastTense = "edited";
				break;
			case "delete":
				pastTense = "deleted";
				userResponse = await userFacade.deleteUser(user.id, user);
				break;
			default:
				throw { code: 400, message: "Unsupported Action, please contact an administrator if this problem persists..." };
		}
		$form.reset();
		closeModals();
		displaySuccess(`User #${userResponse.id} ${userResponse.firstname} ${userResponse.lastname} was successfully ${pastTense}.`);
	} catch (err) {
		console.log(err);
		displayError(err);
	}
	await displayUsers();
	// Everything is complete... enable submit...
	$submit.disabled = false;
}

const $fCreateUser = document.getElementById("f_create_user");
$fCreateUser.onsubmit = (e) => handleFormEvent(e, $fCreateUser, "create");

const $fEditUser = document.getElementById("f_edit_user");
$fEditUser.onsubmit = (e) => handleFormEvent(e, $fEditUser, "edit");

const $fDeleteUser = document.getElementById("f_delete_user");
$fDeleteUser.onsubmit = (e) => handleFormEvent(e, $fDeleteUser, "delete");

document.querySelectorAll(".add-phone-number").forEach((el) => {
	el.addEventListener("click", (event) => {
		event.preventDefault();
		const $target = event.target;
		const $phoneWrapper = $target.closest("form").querySelector(".phone-wrapper");
		const $phoneInnerWrapper = $phoneWrapper.querySelector(".phone-input-wrapper").cloneNode(true);

		const template = document.createElement("template");
		template.innerHTML = '<div class="col-1-sm"><button class="btn btn-danger delete">X</button></div>';
		const $closeButton = template.content.childNodes[0];

		$closeButton.onclick = (closeEvent) => closeEvent.target.closest(".phone-input-wrapper").remove();

		const lastIndex = () => {
			const lastIndexNameAttribute = $phoneWrapper.querySelector(".phone-input-wrapper:last-of-type .phone-number").getAttribute("name");
			return parseInt(lastIndexNameAttribute.split("[")[1].replace("[", "").replace("]", ""));
		};

		$phoneInnerWrapper.append($closeButton);

		const $phoneNumber = $phoneInnerWrapper.querySelector(".phone-number");
		const $phoneDescription = $phoneInnerWrapper.querySelector(".phone-description");

		$phoneNumber.setAttribute("name", `phone[${lastIndex() + 1}][number]`);
		$phoneDescription.setAttribute("name", `phone[${lastIndex() + 1}][description]`);

		$phoneNumber.value = "";
		$phoneDescription.value = "";

		$phoneWrapper.append($phoneInnerWrapper);
		console.log($phoneWrapper);
	});
});
/**
 *
 * Our prompts...
 *
 */

// This will save us boilerplate code, as both prompts do almost the same thing.
async function promptDynamicUserModal($target, requestType) {
	const id = $target.dataset.id;

	// Update our Edit Modal...
	const $modal = document.getElementById(`m_${requestType}_user`);
	$modal.querySelector(".modal-title span").innerText = id;
	$modal.querySelector(".hidden-id").value = id;

	window.euChoices.removeActiveItems();
	window.duChoices.removeActiveItems();

	try {
		const user = await userFacade.findUser(id);
		const $phoneWrapper = $modal.querySelector(".phone-wrapper");
		const $phoneInputWrapper = $modal.querySelector(".phone-input-wrapper");

		$phoneWrapper.innerHTML = "";

		// Populate our form with data we already know
		let phoneItems = 0;
		for (const [key, value] of Object.entries(user)) {
			if (typeof value == "object") {
				if (Array.isArray(value)) {
					if (key == "hobbies") {
						value.forEach((hobby) => {
							window.euChoices.setChoiceByValue(hobby.name);
							window.duChoices.setChoiceByValue(hobby.name);
						});
					} else if (key == "phone") {
						value.forEach((phone) => {
							const $phoneItem = $phoneInputWrapper.cloneNode(true);

							const $phoneNumber = $phoneItem.querySelector(".phone-number");
							$phoneNumber.setAttribute("name", `phone[${phoneItems}][number]`);
							$phoneNumber.value = phone.number;

							const $phoneDescription = $phoneItem.querySelector(".phone-description");
							$phoneDescription.setAttribute("name", `phone[${phoneItems}][description]`);
							$phoneDescription.value = phone.description;

							if (requestType == "edit" && phoneItems != 0) {
								const template = document.createElement("template");
								template.innerHTML = '<div class="col-1-sm"><button class="btn btn-danger delete">X</button></div>';
								const $closeButton = template.content.childNodes[0];

								$closeButton.onclick = (closeEvent) => closeEvent.target.closest(".phone-input-wrapper").remove();

								$phoneItem.appendChild($closeButton);
							}

							$phoneWrapper.append($phoneItem);
							phoneItems++;
						});
					}
				} else {
					if (key == "address") {
						for (const [aKey, aValue] of Object.entries(value)) {
							const input = $modal.querySelector(`form input[name='address[${aKey}]']`);
							if (!input) continue;
							input.value = aValue;
						}
					}
				}
			} else {
				const input = $modal.querySelector(`form input[name='${key}']`);
				if (!input) continue;
				input.value = value;
			}
		}

		if (requestType == "delete") {
			$modal.querySelectorAll("input:not(input[type='submit'])").forEach((input) => {
				input.readOnly = true;
				input.classList.add("disabled");
			});
			window.duChoices.disable();
		}

		window.location.hash = `m_${requestType}_user`;
	} catch (err) {
		// If we can't find the user, it was probably deleted by someone else... just refresh the user table..?
		displayError(err);
		displayUsers();
	}
}
// Our edit and delete prompts will be dynamically added, so we have to listen on our entire document.
document.addEventListener("click", async (e) => {
	const $target = e.target;
	if ($target.classList.contains("phoneObject")) {
		const phoneNumbers = await userFacade.getPhoneNumbers($target.dataset.id);
		document.getElementById("phoneTable").querySelector("tbody").innerHTML = makePhoneRows(phoneNumbers);
	}

	if ($target.classList.contains("addressObject")) {
		const address = await userFacade.getAddress($target.dataset.id);
		document.getElementById("addressStreet").innerText = "Vej: " + address.street;
		document.getElementById("addressPostalcode").innerText = "Postnummer: " + address.postalcode;
		document.getElementById("addressCity").innerText = "By: " + address.city;
	}

	if ($target.classList.contains("hobbyObject")) {
		const hobbies = await userFacade.getUserHobbies($target.dataset.id);
		document.getElementById("hobbyTable").querySelector("tbody").innerHTML = makeHobbyTableRow(hobbies);
	}

	// Fire our edit prompt
	if ($target.classList.contains("prompt-edit") || $target.classList.contains("prompt-delete")) {
		e.preventDefault();
		promptDynamicUserModal($target, $target.classList.contains("prompt-edit") ? "edit" : "delete");
	}
});

function makeHobbyTableRow(hobbies) {
	return hobbies.map((hobby) => `<tr><td>${hobby.name}</td><td>${hobby.category}</td><td>${hobby.type}</td></tr>`).join("");
}

function makePhoneRows(phoneList) {
	return phoneList.map((phone) => `<tr><td>${phone.number}</td><td>${phone.description}</td></tr>`).join("");
}

/**
 *
 * Notifications
 *
 */
function displayError(error) {
	halfmoon.initStickyAlert({
		content: error.message || "Unknown error ocurred...",
		title: `Error ${"- " + error.code}`,
		alertType: "alert-danger",
		fillType: "filled",
	});
}

function displaySuccess(msg) {
	halfmoon.initStickyAlert({
		content: msg || "",
		title: "Success.",
		alertType: "alert-success",
		fillType: "filled",
	});
}

/**
 *
 *
 * Other global functions we need.
 *
 */

// Why doesn't halfmoon have a good way to just close all modals!?
function closeModals() {
	window.location.hash = "#";
}

function formToJSON($form) {
	const formData = new FormData($form);
	const data = [...formData.entries()];

	/**
	 *
	 * @Botched -- For select multiple and (choices.js)
	 */
	let i = 0;
	data.forEach((x) => {
		if (x[0] == "hobbies") {
			x[0] = `hobbies[${i}][name]`;
			i++;
		}
	});
	const asString = data.map((x) => `${encodeURIComponent(x[0])}=${encodeURIComponent(x[1])}`).join("&");

	const object = {};

	parse_str(asString, object);

	for (const [sKey, sValue] of Object.entries(object)) {
		if (sValue[0] && typeof sValue == "object") {
			const array = [];
			Object.values(sValue).forEach((value) => {
				if (value["name"] !== "") {
					array.push(value);
				}
			});
			object[sKey] = array;
		}
	}
	return object;
}

/**
 * @deprecated moved to choices.
 */
/*
document.querySelector("#hobbies").addEventListener("click", async (e) => {
	if (e.target.name == "addHobbyBtn") {
		const allHobbies = await userFacade.getAllHobbies();
		const inputField = e.target.closest(".form-row").querySelector("input[type=text]").value;
		let exists = Object.keys(allHobbies).some((k) => {
			if (allHobbies[k].name === inputField) {
				return true;
			}
		});
		if (exists) {
			let name = document.querySelector("#hobbies").lastElementChild.querySelector("input[type=text]").name;
			let numberOfInputs = 1 + parseInt(name.substring(name.indexOf("[") + 1, name.indexOf("]")));
			let newHobbyDiv = e.target.closest(".form-row").cloneNode(true);
			let currentTarget = e.target.closest(".form-row");
			currentTarget.querySelector("input[type=text]").readOnly = "readonly";

			let button = currentTarget.querySelector("input[type=button");
			button.classList.add("btn-danger");
			button.name = "removeHobbyBtn";
			button.value = "Fjern";

			let newHobbyDivField = newHobbyDiv.querySelector("input[type=text]");
			newHobbyDivField.value = "";
			newHobbyDivField.name = `hobbies[${numberOfInputs}][name]`;
			newHobbyDivField.required = false;

			document.getElementById("hobbies").append(newHobbyDiv);
		} else {
			displayError("");
		}
	} else if (e.target.name == "removeHobbyBtn") {
		let currentTarget = e.target.closest(".form-row");
		let name = currentTarget.querySelector("input[type=text]").name;
		if (name !== "hobbies[0][name]") {
			currentTarget.remove();
		} else {
			let button = currentTarget.querySelector("input[type=button");
			button.classList.remove("btn-danger");
			button.name = "addHobbyBtn";
			button.value = "Tilføj";
			currentTarget.querySelector("input[type=text]").readOnly = false;
		}
	}
});
*/

document.getElementById("f_search").onsubmit = async (e) => {
	e.preventDefault();
	const value = document.getElementById("searchfield").value;
	const searchType = document.querySelector("#searchBar select").value;
	displayUserBySearchType(searchType, value);
	console.log("test?");
};

async function displayUserBySearchType(searchType, searchValue) {
	const $utc = document.getElementById("users_table").querySelector("tbody");
	try {
		console.log("test?");
		let users = await userFacade.findUsersBySearchType(searchType, searchValue);
		users = Array.isArray(users) ? users : [users];
		console.log(users);
		const $rows = users.length > 0 ? users.map((user) => userRow(user)).join("") : "<tr><td>No users found...</td></tr>";
		$utc.innerHTML = $rows;
		document.getElementById("totalUsersFromSearch").innerText = users.length;
	} catch (err) {
		displayError(err);
	}
}
