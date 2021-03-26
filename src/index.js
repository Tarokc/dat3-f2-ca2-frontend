import "./style.css";
import * as userFacade from "./scripts/userFacade";

import { parse_str } from "locutus/php/strings";

import "halfmoon/css/halfmoon-variables.min.css";
import halfmoon from "halfmoon";
window.halfmoon = halfmoon;

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
    } catch (err) {
        displayError(err);
    }
}

// Initial load, display our users.
displayUsers();

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
        displaySuccess(`User #${userResponse.id} ${userResponse.fName} ${userResponse.lName} was successfully ${pastTense}.`);
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

    try {
        const user = await userRepository.findUser(id);

        // Populate our form with data we already know
        for (const [key, value] of Object.entries(user)) {
            const input = $modal.querySelector(`form input[name='${key}']`);
            if (!input) return;
            input.value = value;
            // We don't want the use to edit our data (even though it wouldn't do anything...)
            if (requestType == "delete") {
                input.readOnly = true;
                input.classList.add("disabled");
            }
        }

        // Open our modal.
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
        document.getElementById("phonePrivate").innerText = phoneNumbers[0].description + ": " + phoneNumbers[0].number;
        document.getElementById("phoneWork").innerText = phoneNumbers[1].description + ": " + phoneNumbers[1].number;
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
    return hobbies.map((hobby) => `<tr><td>${hobby.name}</td><td>${hobby.category}</td><td>${hobby.type}</td></tr>`);
}

/**
 *
 * Notifications
 *
 */
function displayError(error) {
    halfmoon.initStickyAlert({
        content: error.message || "Unknown error ocurred...",
        title: `Error - ${error.code || ""}`,
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


document.querySelector("#hobbies").addEventListener('click', async (e) => {
    if (e.target.name == 'addHobbyBtn') {
        const allHobbies = await userFacade.getAllHobbies();
        const inputField = e.target.closest(".form-row").querySelector("input[type=text]").value
        let exists = (Object.keys(allHobbies).some((k) => {
            if (allHobbies[k].name === inputField) {
                return true
            }
        }))
        if (exists) {
            let name = document.querySelector("#hobbies").lastElementChild.querySelector("input[type=text]").name
            let numberOfInputs = 1 + parseInt(name.substring(name.indexOf('[') + 1, name.indexOf(']')))
            let newHobbyDiv = e.target.closest(".form-row").cloneNode(true)
            let currentTarget = e.target.closest(".form-row")
            currentTarget.querySelector("input[type=text]").readOnly = 'readonly'

            let button = currentTarget.querySelector("input[type=button")
            button.classList.add("btn-danger")
            button.name = 'removeHobbyBtn'
            button.value = 'Fjern'

            let newHobbyDivField = newHobbyDiv.querySelector("input[type=text]")
            newHobbyDivField.value = ""
            newHobbyDivField.name = `hobbies[${numberOfInputs}][name]`
            newHobbyDivField.required = false

            document.getElementById("hobbies").append(newHobbyDiv)
        }
        else {
            displayError("")
        }
    }

    else if (e.target.name == 'removeHobbyBtn') {
        let currentTarget = e.target.closest(".form-row")
        let name = currentTarget.querySelector("input[type=text]").name
        if (name !== 'hobbies[0][name]') {
            currentTarget.remove()
        }
        else {
            let button = currentTarget.querySelector("input[type=button")
            button.classList.remove("btn-danger")
            button.name = 'addHobbyBtn'
            button.value = 'Tilføj'
            currentTarget.querySelector("input[type=text]").readOnly = false
        }
    }
})