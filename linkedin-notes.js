// ==UserScript==
// @name         LinkedIn Connection Notes
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Add notes to LinkedIn Connections
// @author       leohumnew
// @match        https://www.linkedin.com/mynetwork/invite-connect/connections/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=linkedin.com
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';
    let BASE_CLOUD_LINK = "LINK TO GOOGLE SCRIPT";

    // Wait until div with class "mn-connection-card" is added to DOM, using MutationObserver
    const startObserving = (domNode, classToLookFor) => {
        const observer = new MutationObserver(mutations => {
          mutations.forEach(function (mutation) {  
            const elementAdded = Array.from(mutation.addedNodes).some(
              element => {
                if (element.classList) {
                  return element.classList.contains(classToLookFor);
                } else {
                  return false;
                }
              },
            );
      
            if (elementAdded) {
                initCard(mutation.addedNodes[0]);
            }
          });
        });
      
        observer.observe(domNode, {
          childList: true,
          attributes: true,
          characterData: true,
          subtree: true,
        });
      
        return observer;
    };
    startObserving(document.body, "mn-connection-card");
    loadFromCloudStorage();

    // Add notes link to mn-connection-card__details
    function initCard(addedCard) {
        let notesLink = document.createElement("a");
        notesLink.className = "mn-connection-card__notes";
        let note = getNote(addedCard.getElementsByClassName("mn-connection-card__link")[0].href);
        if (note == "") {
            notesLink.innerHTML = " Add note";
        } else {
            notesLink.innerHTML = "<br>" + note;
        }
        notesLink.href = "#";
        notesLink.onclick = function() {
            openNotes(addedCard);
        };
        addedCard.getElementsByClassName("time-badge")[0].appendChild(notesLink);
    }

    //---------- MAIN FUNCTIONS ----------//
    var connectionNotes;
    // Local storage functions
    function getFromLocalStorage() {
        connectionNotes = JSON.parse(localStorage.getItem("linkedInNotes"));
        if (connectionNotes == null) {
            connectionNotes = {};
        }
    }
    function saveToLocalStorage() {
        localStorage.setItem("linkedInNotes", JSON.stringify(connectionNotes));
    }
    // Cloud storage functions
    function saveToCloudStorage(name, note, link) {
        try {

            let requestBaseURL = BASE_CLOUD_LINK;
            let requestURL = requestBaseURL + "?name=" + encodeURI(name) + "&note=" + encodeURI(note) + "&link=" + encodeURI(link);

            GM.xmlHttpRequest ({
                method:     "GET",
                url:        requestURL,
                onload:     function (response) {
                    console.log(response);
                }
            });
        } catch (error) {
            console.log("Error saving to cloud storage: " + error);
        }        
    }
    function loadFromCloudStorage() {
        try {
            let requestBaseURL = BASE_CLOUD_LINK;
            let requestURL = requestBaseURL + "?name=load&note=load&link=load";

            GM.xmlHttpRequest ({
                method:     "GET",
                url:        requestURL,
                onload:     function (response) {
                    console.log(response);
                    connectionNotes = JSON.parse(response.responseText);
                    saveToLocalStorage();
                }
            });
        } catch (error) {
            console.log("Error loading from cloud storage: " + error);
        }
    }

    // Add styles to page
    let styles = document.createElement("style");
    styles.innerHTML = ".notesPopup {position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: white; padding: 10px; z-index: 1000; width: 500px; text-align: center; box-shadow: var(--elevation-raised)!important; border-radius: 5px;}";
    styles.innerHTML += ".notesPopup h3 {font-family: var(--artdeco-reset-typography-font-family-sans); font-weight: 600; font-size: 24px}";
    styles.innerHTML += ".notesPopup textarea {margin: 10px 0; width: 100%; height: 200px;}";
    styles.innerHTML += ".notesPopup button {margin: 10px 0;}";
    styles.innerHTML += ".notesPopup button:hover {cursor: pointer; background-color: #e6e6e6;}";
    styles.innerHTML += ".notesPopup .closeButton {color: var(--color-icon-nav); position: absolute; top: 0; right: 0; margin: 10px; font-size: 24px; background-color: transparent;}";
    styles.innerHTML += ".notesPopup .closeButton:hover {color: var(--color-action)}";
    document.head.appendChild(styles);

    // Get note for connection
    function getNote(connectionLink) {
        getFromLocalStorage();
        if (connectionNotes[connectionLink] == null) {
            return "";
        } else {
            return connectionNotes[connectionLink][1];
        }
    }
    function editNote(connectionLink, noteName, noteText, noteCardElement) {
        getFromLocalStorage();
        if (noteText == "" && connectionNotes[connectionLink] != null) {
            saveToCloudStorage(noteName, noteText, connectionLink);
            delete connectionNotes[connectionLink];
            saveToLocalStorage();
        } else {
            if (connectionNotes[connectionLink] == null) {
                connectionNotes[connectionLink] = [noteName, noteText];
            } else {
                connectionNotes[connectionLink][1] = noteText;
            }
            saveToLocalStorage();
            saveToCloudStorage(noteName, noteText, connectionLink);
            // Update note text on card
            noteCardElement.innerHTML = "<br>" + noteText;
        }
    }

    // Open Notes function - open a popup with notes for the connection
    function openNotes(connectionCard) {
        let link = connectionCard.getElementsByClassName("mn-connection-card__link")[0].href;
        let name = connectionCard.getElementsByClassName("mn-connection-card__name")[0].innerText;
        let noteText = getNote(link);

        // Create popup, centered on the screen, with the name at the top and a textbox containing the note
        let popup = document.createElement("div");
        popup.className = "notesPopup";
        popup.innerHTML = "<h3>" + name + "</h3>"; // Name
        let closeButton = document.createElement("button"); // Close button
        closeButton.className = "closeButton";
        closeButton.innerHTML = "X";
        closeButton.onclick = function() {
            popup.remove();
        };
        let noteBox = document.createElement("textarea"); // Note box
        noteBox.value = noteText;
        let saveButton = document.createElement("button"); // Save button
        saveButton.className = "saveButton artdeco-button artdeco-button--2 artdeco-button--secondary";
        saveButton.innerHTML = "Save";
        saveButton.onclick = function() {
            editNote(link, name, noteBox.value, connectionCard.getElementsByClassName("mn-connection-card__notes")[0]);
            popup.remove();
        };
        popup.append(closeButton, noteBox, saveButton);
        document.body.appendChild(popup);
    }
})();