let fakePeople = [{
    "id" : 1,
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
        "id" : 2,
        "firstname": "John",
        "lastname": "Smith",
        "address": {
            "street": "Roskildevej 2.A",
            "postalcode": 4000,
            "city": "Roskilde"
        },
        "phone": [
            {
                "number": 10102025,
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
    }
]

function getPeople() {
    return fakePeople;
}

function getPerson(number) {
    return fakePeople.filter(person => { 
        return person.phone.filter(phone => phone.number === number)
    });
}

export {getPeople, getPerson}