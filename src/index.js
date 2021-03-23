import "./style.css"
import "bootstrap/dist/css/bootstrap.css"
import * as userFacade from './fakeFacade'

hideAllShowOne("resultPerson");

function hideAllShowOne(idToShow) {
  document.getElementById("resultTable").style = "display:none";
  document.getElementById("resultPerson").style = "display:none";
  document.getElementById("addPerson").style = "display:none";
  document.getElementById(idToShow).style = "display:block";
};

document.getElementById("searchBtn").onclick = function(evt) {
  let searchValue = document.getElementById("searchfield").value;
  if (searchValue.length === 8 && !searchValue.isNaN) {
    console.log("Person shown");
    hideAllShowOne("resultPerson");
  }
  else {
    console.log("resultTable shown");
    hideAllShowOne("resultTable");
  }
  evt.preventDefault();
};

document.getElementById("newPersonBtn").onclick = function(evt) {
  console.log("AddPerson shown");
  hideAllShowOne("addPerson");
  evt.preventDefault();
};


document.getElementById("")

document.getElementById("resultPerson").innerHTML = userFacade.getPerson(10102020)

userFacade.getPerson(10102020).map(object => {for (var prop in object) {
  if (Object.prototype.hasOwnProperty.call(object, prop)) {
    console.log(object)
  }
}})