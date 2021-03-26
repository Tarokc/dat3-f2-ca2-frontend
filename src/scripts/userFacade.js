import { async } from "regenerator-runtime";

const API = "https://3sem.dyrhoi.com/ca2/api/people";

async function getUsers() {
	const urlPath = `${API}`;
	const users = await handleHttpErrors(await fetch(urlPath));
	return users.data
}

async function addUser(user) {
	console.log(user)
	const options = makeOptions("POST", user);
	return handleHttpErrors(await fetch(API, options));
}

async function deleteUser(id) {
	id = parseInt(id) || -1;

	const options = makeOptions("DELETE");
	const urlPath = `${API}/${id}`;
	return handleHttpErrors(await fetch(urlPath, options));
}

async function editUser(id, user) {
	id = parseInt(id) || -1;

	const options = makeOptions("PUT", user);
	const urlPath = `${API}/${id}`;
	return handleHttpErrors(await fetch(urlPath, options));
}

async function findUser(id) {
	id = parseInt(id) || -1;

	const urlPath = `${API}/${id}`;
	return handleHttpErrors(await fetch(urlPath));
}


function makeOptions(method, body) {
	var opts = {
		method: method,
		headers: {
			"Content-type": "application/json",
			Accept: "application/json",
		},
	};
	if (body) {
		opts.body = JSON.stringify(body);
	}
	return opts;
}

async function handleHttpErrors(res) {
	if (!res.ok) {
		const err = await res.json();
		//console.log(err); // For debugging...
		throw err;
	}
	return res.json();
}

async function getPhoneNumbers(id) {
	return (await findUser(id)).phone
}

async function getAddress(id) {
	return (await findUser(id)).address
}


async function getUserHobbies(id) {
	return (await findUser(id)).hobbies
}

async function findUsersBySearchType(searchType, searchValue) {
	let urlPath = "";
	let users = [];
	switch (searchType) {
		case "phone":
			urlPath = `${API}/phone/${searchValue}`
			return handleHttpErrors(await fetch(urlPath));
			break;
		case "hobby":
			urlPath = `${API}/hobby/${searchValue}`
			users = await handleHttpErrors(await fetch(urlPath));
			return users.data;
			break;
		case "city":
			urlPath = `${API}/postalcode/${searchValue}`
			users = await handleHttpErrors(await fetch(urlPath));
			return users.data;
			break;
	}
}

export { getUsers, addUser, deleteUser, editUser, findUser, getPhoneNumbers, getAddress, getUserHobbies, findUsersBySearchType };