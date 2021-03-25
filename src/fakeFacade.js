let fakeUsers = [{
    "id": 1,
    "firstname": "John",
    "lastname": "Smith",
    "address": {
        "street": "Roskildevej 2.A",
        "postalcode": 4000,
        "city": "Roskilde"
    },
    "phone": [
        {
            "number": 10102020,
            "description": "Work phone"
        },
        {
            "number": 10102030,
            "description": "Private phone"
        }
    ],
    "email": "johnsmith@test.dk",
    "hobbies": [
        {
            "name": "Flag fodbold",
            "category": "Generel",
            "type": "Udendørs"
        }
    ]
},
{
    "id": 2,
    "firstname": "Morten",
    "lastname": "Jensen",
    "address": {
        "street": "Spasservej 69",
        "postalcode": 8888,
        "city": "Somewhere"
    },
    "phone": [
        {
            "number": 12345678,
            "description": "Work phone"
        },
        {
            "number": 88888888,
            "description": "Private phone"
        }
    ],
    "email": "spasserman@retard.dk",
    "hobbies": [
        {
            "name": "Svømning",
            "category": "Generel",
            "type": "Indendørs"
        }
    ]
}
]

function getUsers() {
    return fakeUsers;
}

function getUser(number) {
    return fakeUsers.filter(user => user.phone.some(phone => phone.number == number))
}

function getUserById(id) {
    return fakeUsers.find(user => user.id == id);
}

function addUser(user) {
    console.log(user)
}

function editUser(id, user) {
    console.log(id)
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

export { getUsers, getUser, getPhoneNumbers, getAddress, getUserHobbies }