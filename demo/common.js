require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"common":[function(require,module,exports){
//An array to use in the tree
module.exports = [require("./sample.json"), require("./sample2.json")];
},{"./sample.json":1,"./sample2.json":2}],1:[function(require,module,exports){
module.exports=[
  {
    "_id": "54c8c28e5a0b36493042744d",
    "index": 0,
    "guid": "1b09625f-3338-43ce-a744-5da10a975364",
    "isActive": false,
    "balance": "$1,781.72",
    "picture": "http://placehold.it/32x32",
    "age": 22,
    "eyeColor": "green",
    "name": "Gilbert Barr",
    "gender": "male",
    "company": "TROPOLIS",
    "email": "gilbertbarr@tropolis.com",
    "phone": "+1 (970) 446-2143",
    "address": "668 Hinsdale Street, Rehrersburg, Arkansas, 2479",
    "about": "Consequat eiusmod mollit ex sint cillum consequat cillum. Et nisi excepteur amet sint in est voluptate est incididunt consectetur mollit deserunt cupidatat. Aliquip tempor minim ipsum ipsum non. Ipsum occaecat aliqua sit adipisicing eu ex anim non sint est est officia aute id. Occaecat consequat incididunt elit laboris elit cupidatat dolor.\r\n",
    "registered": "2014-09-27T16:34:13 -10:00",
    "latitude": -17.787031,
    "longitude": -87.892537,
    "tags": [
      "excepteur",
      "fugiat",
      "labore",
      "aliqua",
      "laboris",
      "tempor",
      "fugiat"
    ],
    "friends": [
      {
        "id": 0,
        "name": "Espinoza Henderson"
      },
      {
        "id": 1,
        "name": "Diana Anthony"
      },
      {
        "id": 2,
        "name": "Rice Taylor"
      }
    ],
    "greeting": "Hello, Gilbert Barr! You have 1 unread messages.",
    "favoriteFruit": "banana"
  },
  {
    "_id": "54c8c28eea6f738282ca1a25",
    "index": 1,
    "guid": "20f2f379-257c-40da-b3d6-419d41095c86",
    "isActive": true,
    "balance": "$1,956.49",
    "picture": "http://placehold.it/32x32",
    "age": 25,
    "eyeColor": "blue",
    "name": "Chasity Nolan",
    "gender": "female",
    "company": "ZUVY",
    "email": "chasitynolan@zuvy.com",
    "phone": "+1 (916) 520-2977",
    "address": "316 Lewis Avenue, Cartwright, Vermont, 8195",
    "about": "Nisi sunt exercitation culpa enim in eiusmod irure excepteur irure cupidatat consectetur velit quis proident. Eiusmod consectetur pariatur mollit dolor minim. Cillum laboris in elit nostrud officia labore incididunt mollit reprehenderit. Elit esse ad adipisicing non ut mollit do ea. Anim ut aliquip nostrud do fugiat irure duis ad veniam veniam tempor aute sint deserunt. Ut dolore excepteur irure tempor nisi exercitation ipsum.\r\n",
    "registered": "2014-05-26T22:29:12 -10:00",
    "latitude": -11.784769,
    "longitude": 73.441687,
    "tags": [
      "ipsum",
      "ut",
      "quis",
      "occaecat",
      "elit",
      "veniam",
      "eiusmod"
    ],
    "friends": [
      {
        "id": 0,
        "name": "Hollie Lewis"
      },
      {
        "id": 1,
        "name": "Potts Mcintosh"
      },
      {
        "id": 2,
        "name": "Richards Vinson"
      }
    ],
    "greeting": "Hello, Chasity Nolan! You have 3 unread messages.",
    "favoriteFruit": "banana"
  },
  {
    "_id": "54c8c28ead71820f04908051",
    "index": 2,
    "guid": "e07e84da-90ae-46e3-8619-f61536c93a2a",
    "isActive": true,
    "balance": "$3,858.86",
    "picture": "http://placehold.it/32x32",
    "age": 25,
    "eyeColor": "green",
    "name": "Dejesus Garza",
    "gender": "male",
    "company": "COMBOGENE",
    "email": "dejesusgarza@combogene.com",
    "phone": "+1 (805) 445-2653",
    "address": "606 Bragg Street, Wadsworth, New Hampshire, 5126",
    "about": "Ullamco quis ex nulla irure velit est aliquip nulla proident eu nulla in incididunt adipisicing. Elit mollit laboris sint dolore aliqua elit. Culpa aliquip elit nostrud officia esse eu dolore. Mollit nisi aute non ex sit dolore aliqua fugiat quis adipisicing. Fugiat laboris culpa qui et cillum reprehenderit proident excepteur proident excepteur et non elit deserunt. Ipsum occaecat pariatur consectetur enim labore labore magna incididunt sunt nostrud Lorem laboris cillum.\r\n",
    "registered": "2014-03-03T00:48:58 -11:00",
    "latitude": 50.631783,
    "longitude": -162.504961,
    "tags": [
      "in",
      "aute",
      "mollit",
      "quis",
      "reprehenderit",
      "consectetur",
      "aliqua"
    ],
    "friends": [
      {
        "id": 0,
        "name": "Ofelia Mcneil"
      },
      {
        "id": 1,
        "name": "Lilia Hinton"
      },
      {
        "id": 2,
        "name": "Twila Barnes"
      }
    ],
    "greeting": "Hello, Dejesus Garza! You have 5 unread messages.",
    "favoriteFruit": "banana"
  },
  {
    "_id": "54c8c28e23726f3383beaf37",
    "index": 3,
    "guid": "7d684f93-a18a-4c1f-95e7-4724b16bc38c",
    "isActive": false,
    "balance": "$1,233.92",
    "picture": "http://placehold.it/32x32",
    "age": 27,
    "eyeColor": "brown",
    "name": "Becker Ewing",
    "gender": "male",
    "company": "STELAECOR",
    "email": "beckerewing@stelaecor.com",
    "phone": "+1 (938) 508-2467",
    "address": "436 Scholes Street, Sanders, Iowa, 9764",
    "about": "Anim amet ad dolor elit adipisicing excepteur esse occaecat mollit consectetur aliqua voluptate non. Consectetur laboris sunt elit qui. Ut minim non veniam in irure ipsum id esse do.\r\n",
    "registered": "2014-03-01T08:06:26 -11:00",
    "latitude": 5.899555,
    "longitude": 115.160159,
    "tags": [
      "consequat",
      "do",
      "non",
      "esse",
      "voluptate",
      "irure",
      "anim"
    ],
    "friends": [
      {
        "id": 0,
        "name": "Cox Merritt"
      },
      {
        "id": 1,
        "name": "Tamra Guerrero"
      },
      {
        "id": 2,
        "name": "Bryant Curtis"
      }
    ],
    "greeting": "Hello, Becker Ewing! You have 7 unread messages.",
    "favoriteFruit": "banana"
  },
  {
    "_id": "54c8c28ebe3a429ecc3b99dd",
    "index": 4,
    "guid": "bc2e6e51-46f6-461c-9423-efd3f61aa780",
    "isActive": false,
    "balance": "$1,686.66",
    "picture": "http://placehold.it/32x32",
    "age": 29,
    "eyeColor": "brown",
    "name": "Janie Humphrey",
    "gender": "female",
    "company": "HOMETOWN",
    "email": "janiehumphrey@hometown.com",
    "phone": "+1 (814) 507-2560",
    "address": "958 Doone Court, Hachita, Alaska, 3749",
    "about": "Pariatur id qui consectetur sint irure id cillum mollit. Cupidatat occaecat reprehenderit laborum magna nostrud qui velit quis ex qui velit fugiat aute. Do sunt velit amet ex adipisicing non adipisicing. Eiusmod occaecat et nostrud duis nulla nisi est ea esse.\r\n",
    "registered": "2014-10-24T07:54:53 -11:00",
    "latitude": -83.023498,
    "longitude": -26.317472,
    "tags": [
      "qui",
      "eu",
      "nostrud",
      "nulla",
      "magna",
      "sunt",
      "velit"
    ],
    "friends": [
      {
        "id": 0,
        "name": "Debora Craft"
      },
      {
        "id": 1,
        "name": "Rivera Ramsey"
      },
      {
        "id": 2,
        "name": "Edna Conley"
      }
    ],
    "greeting": "Hello, Janie Humphrey! You have 1 unread messages.",
    "favoriteFruit": "strawberry"
  },
  {
    "_id": "54c8c28ea33e3c2c98f5bfcb",
    "index": 5,
    "guid": "7753ed3f-852e-49d6-9bd4-4fb9cb1bc2ad",
    "isActive": false,
    "balance": "$1,475.57",
    "picture": "http://placehold.it/32x32",
    "age": 35,
    "eyeColor": "brown",
    "name": "Georgia Mclean",
    "gender": "female",
    "company": "OVIUM",
    "email": "georgiamclean@ovium.com",
    "phone": "+1 (853) 523-2687",
    "address": "809 Evergreen Avenue, Kanauga, Virginia, 4798",
    "about": "Laborum sit esse consectetur do in in veniam aute. Nisi nostrud id ipsum anim pariatur commodo ad ut nulla id consequat. Commodo et qui elit officia commodo eu aliquip consectetur eu occaecat. Sint aliquip consequat ipsum consectetur eu sint minim anim aliqua. Aute sit proident tempor excepteur minim. Sit et ad reprehenderit cupidatat anim aliquip consectetur quis est nulla.\r\n",
    "registered": "2014-02-22T01:06:10 -11:00",
    "latitude": 37.818249,
    "longitude": 60.525852,
    "tags": [
      "labore",
      "anim",
      "sit",
      "amet",
      "ipsum",
      "velit",
      "in"
    ],
    "friends": [
      {
        "id": 0,
        "name": "Arlene Alvarez"
      },
      {
        "id": 1,
        "name": "Juarez Carr"
      },
      {
        "id": 2,
        "name": "Ebony Jackson"
      }
    ],
    "greeting": "Hello, Georgia Mclean! You have 2 unread messages.",
    "favoriteFruit": "banana"
  }
]
},{}],2:[function(require,module,exports){
module.exports=[
  {
    "_id": "54cdad2758a3d0b7cba5fba8",
    "index": 0,
    "guid": "81fba96b-71cb-4fa9-b9cc-8cf10d46a8cc",
    "isActive": true,
    "balance": "$1,712.40",
    "picture": "http://placehold.it/32x32",
    "age": 29,
    "eyeColor": "brown",
    "name": "Stevenson Langley",
    "gender": "male",
    "company": "IMPERIUM",
    "email": "stevensonlangley@imperium.com",
    "phone": "+1 (881) 557-3210",
    "address": "506 Quentin Street, Clarksburg, South Carolina, 8461",
    "about": "Pariatur dolore ullamco anim deserunt aliqua ipsum minim in enim magna consectetur officia sint irure. Consequat consequat aliqua incididunt non est id voluptate. Aliqua laborum est dolore elit anim nostrud ea duis dolore est incididunt irure. Eu officia commodo elit dolore aliqua qui proident sit sit pariatur velit sit irure. Aute ea est veniam sit excepteur laboris. Esse quis excepteur et nulla eu ex magna voluptate. Sint id elit aliqua elit ea dolor exercitation eu.\r\n",
    "registered": "2014-08-04T02:02:46 -10:00",
    "latitude": -8.543136,
    "longitude": 105.688435,
    "tags": [
      "reprehenderit",
      "aliqua",
      "in",
      "dolore",
      "anim",
      "consequat",
      "amet"
    ],
    "friends": [
      {
        "id": 0,
        "name": "Stout Conrad"
      },
      {
        "id": 1,
        "name": "Carey Poole"
      },
      {
        "id": 2,
        "name": "Avis Espinoza"
      }
    ],
    "greeting": "Hello, Stevenson Langley! You have 1 unread messages.",
    "favoriteFruit": "strawberry"
  },
  {
    "_id": "54cdad27fa327450d6edebae",
    "index": 1,
    "guid": "a17ab55b-ebc5-44a6-958d-e400b3a7477e",
    "isActive": false,
    "balance": "$2,169.45",
    "picture": "http://placehold.it/32x32",
    "age": 39,
    "eyeColor": "blue",
    "name": "Pearlie Gamble",
    "gender": "female",
    "company": "EXTRAGENE",
    "email": "pearliegamble@extragene.com",
    "phone": "+1 (904) 548-2493",
    "address": "992 Ashford Street, Gratton, Tennessee, 9079",
    "about": "Pariatur deserunt magna velit do veniam eu incididunt occaecat non deserunt adipisicing consectetur. Dolore eiusmod esse in proident veniam. Est est commodo adipisicing quis minim eu Lorem. Duis pariatur eu tempor aliquip qui. Tempor excepteur culpa laborum fugiat exercitation ipsum ipsum pariatur dolore ad culpa duis dolor.\r\n",
    "registered": "2014-12-18T19:13:21 -11:00",
    "latitude": 89.932379,
    "longitude": -16.658249,
    "tags": [
      "dolor",
      "voluptate",
      "fugiat",
      "eu",
      "irure",
      "mollit",
      "labore"
    ],
    "friends": [
      {
        "id": 0,
        "name": "Russell Mcdaniel"
      },
      {
        "id": 1,
        "name": "Mamie Rowe"
      },
      {
        "id": 2,
        "name": "Harriet Hart"
      }
    ],
    "greeting": "Hello, Pearlie Gamble! You have 3 unread messages.",
    "favoriteFruit": "strawberry"
  },
  {
    "_id": "54cdad27a98b7afd68af79b9",
    "index": 2,
    "guid": "050153db-5a85-43e5-8e79-7c389cb729e1",
    "isActive": true,
    "balance": "$1,875.95",
    "picture": "http://placehold.it/32x32",
    "age": 23,
    "eyeColor": "green",
    "name": "Leanne Guerrero",
    "gender": "female",
    "company": "ZENTIME",
    "email": "leanneguerrero@zentime.com",
    "phone": "+1 (957) 404-3912",
    "address": "520 Shale Street, Gracey, South Dakota, 8494",
    "about": "Fugiat in commodo ipsum in non dolore adipisicing consectetur. Dolore eu elit minim eiusmod mollit id sit. Reprehenderit tempor in exercitation mollit minim pariatur veniam laborum irure voluptate ea in ipsum. Nisi incididunt culpa minim consectetur Lorem.\r\n",
    "registered": "2014-05-11T18:35:35 -10:00",
    "latitude": 57.121549,
    "longitude": -85.869773,
    "tags": [
      "duis",
      "ad",
      "ullamco",
      "pariatur",
      "tempor",
      "excepteur",
      "mollit"
    ],
    "friends": [
      {
        "id": 0,
        "name": "Merle Small"
      },
      {
        "id": 1,
        "name": "Franks Wise"
      },
      {
        "id": 2,
        "name": "Velazquez Wyatt"
      }
    ],
    "greeting": "Hello, Leanne Guerrero! You have 6 unread messages.",
    "favoriteFruit": "banana"
  },
  {
    "_id": "54cdad27e4a4c2a919fc3095",
    "index": 3,
    "guid": "6dad3911-a23a-4d39-abbf-980212c3ae82",
    "isActive": false,
    "balance": "$1,777.25",
    "picture": "http://placehold.it/32x32",
    "age": 22,
    "eyeColor": "brown",
    "name": "Madeline Salazar",
    "gender": "female",
    "company": "PHORMULA",
    "email": "madelinesalazar@phormula.com",
    "phone": "+1 (831) 445-2714",
    "address": "695 Manhattan Avenue, Wildwood, Marshall Islands, 9897",
    "about": "Consequat culpa esse laborum do et. Cillum duis nulla ex aliquip dolore qui esse. Magna eu sunt ut adipisicing qui dolor quis et duis dolore. Ipsum aliquip mollit enim consectetur laborum nostrud non nostrud ut culpa aliquip. Eu laboris nostrud ut dolor amet nostrud anim occaecat mollit. Lorem Lorem proident fugiat reprehenderit ad velit est laboris.\r\n",
    "registered": "2014-05-19T05:13:56 -10:00",
    "latitude": -2.967878,
    "longitude": -70.324888,
    "tags": [
      "excepteur",
      "duis",
      "id",
      "consectetur",
      "commodo",
      "quis",
      "ea"
    ],
    "friends": [
      {
        "id": 0,
        "name": "Miriam Schultz"
      },
      {
        "id": 1,
        "name": "Garrett Brennan"
      },
      {
        "id": 2,
        "name": "Mildred Phelps"
      }
    ],
    "greeting": "Hello, Madeline Salazar! You have 2 unread messages.",
    "favoriteFruit": "strawberry"
  },
  {
    "_id": "54cdad273bc0dac9f9900e22",
    "index": 4,
    "guid": "273840e6-f00a-4476-99fd-1bccbe9d7114",
    "isActive": true,
    "balance": "$3,392.01",
    "picture": "http://placehold.it/32x32",
    "age": 22,
    "eyeColor": "green",
    "name": "Hughes Conway",
    "gender": "male",
    "company": "PLAYCE",
    "email": "hughesconway@playce.com",
    "phone": "+1 (871) 422-2158",
    "address": "377 Gem Street, Moraida, Wisconsin, 768",
    "about": "Qui quis exercitation voluptate cillum ipsum nostrud nulla culpa irure proident aute veniam voluptate elit. Veniam mollit pariatur minim adipisicing irure ea ipsum. Lorem pariatur voluptate ullamco irure magna occaecat voluptate cupidatat duis nostrud velit culpa labore proident. Do ullamco sint amet excepteur Lorem esse nisi veniam aliquip sint ex.\r\n",
    "registered": "2014-02-21T17:20:13 -11:00",
    "latitude": 54.917013,
    "longitude": 101.043586,
    "tags": [
      "voluptate",
      "nulla",
      "minim",
      "tempor",
      "aute",
      "adipisicing",
      "cupidatat"
    ],
    "friends": [
      {
        "id": 0,
        "name": "Beatriz Thomas"
      },
      {
        "id": 1,
        "name": "Lynette Mcpherson"
      },
      {
        "id": 2,
        "name": "Lacy Mayo"
      }
    ],
    "greeting": "Hello, Hughes Conway! You have 10 unread messages.",
    "favoriteFruit": "strawberry"
  },
  {
    "_id": "54cdad2713233fcd68a20bfa",
    "index": 5,
    "guid": "a7d4530e-bc34-47ed-a615-41238ced6bcc",
    "isActive": true,
    "balance": "$1,624.15",
    "picture": "http://placehold.it/32x32",
    "age": 35,
    "eyeColor": "blue",
    "name": "Trujillo Griffin",
    "gender": "male",
    "company": "XYMONK",
    "email": "trujillogriffin@xymonk.com",
    "phone": "+1 (806) 507-2966",
    "address": "655 Beard Street, Bluffview, Puerto Rico, 8612",
    "about": "Anim do officia officia ex aute minim. Culpa dolor qui mollit sint. Laborum enim culpa qui nulla non ut Lorem do culpa sit. Quis non exercitation labore aute tempor est amet adipisicing consectetur nisi excepteur in magna et. Cupidatat non ipsum occaecat nostrud nisi ullamco amet. Et occaecat tempor pariatur eiusmod eu non exercitation non pariatur irure in est.\r\n",
    "registered": "2014-09-17T16:38:25 -10:00",
    "latitude": 49.479062,
    "longitude": 21.550879,
    "tags": [
      "esse",
      "ex",
      "sit",
      "elit",
      "magna",
      "adipisicing",
      "pariatur"
    ],
    "friends": [
      {
        "id": 0,
        "name": "Jarvis Baldwin"
      },
      {
        "id": 1,
        "name": "Bridges Beck"
      },
      {
        "id": 2,
        "name": "Estela Serrano"
      }
    ],
    "greeting": "Hello, Trujillo Griffin! You have 3 unread messages.",
    "favoriteFruit": "apple"
  }
]
},{}]},{},["common"]);
