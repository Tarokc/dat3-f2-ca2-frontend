const API = "https://3sem.dyrhoi.com/ca2/people";

async function getUsers() {
	const urlPath = `${API}`;
	return handleHttpErrors(await fetch(urlPath));
}

async function addUser(user) {
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

function getPhoneNumbers(id) {
	return getUserById(id).phone
}

function getAddress(id) {
	return getUserById(id).address
}

function getUserHobbies(id) {
	console.log(getUserById(id).hobbies)
	return getUserById(id).hobbies
}

export { getUsers, addUser, deleteUser, editUser, findUser, getPhoneNumbers, getAddress, getUserHobbies };