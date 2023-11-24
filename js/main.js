async function openBilingual() {
  let tracks = document.getElementsByTagName("track");
  let en;
  if (tracks.length) {
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].srclang === "en") {
        en = tracks[i];
      }
    }

    if (en) {
      en.track.mode = "showing";

      await sleep(500);
      let cues = en.track.cues;

      let cuesTextList = getTexts(cues);
      getTranslation(cuesTextList, (translatedText) => {
        let translatedList = splitStringWithId(translatedText);
        for (let i = 0; cues.length; i++) {
          if (translatedList[i].id != undefined) {
            if (cues[i].id == translatedList[i].id) {
              cues[i].text = translatedList[i].text;
            }
          }
        }
      });
    }
  }
}

function removeSpaceAfterId(inputString) {
  let regex = /id-\s*(\d+)/g;
  let result = inputString.replace(regex, "id-$1");
  return result;
}

function splitStringWithId(inputString) {
  let regex = /id-(\d+)/g;
  let matches = inputString.matchAll(regex);
  let result = [];

  let currentMatch = matches.next();
  while (!currentMatch.done) {
    let id = currentMatch.value[1];
    let nextMatch = matches.next();

    let text = "";
    if (!nextMatch.done) {
      text = inputString.substring(currentMatch.value.index + currentMatch.value[0].length, nextMatch.value.index).trim();
    } else {
      text = inputString.substring(currentMatch.value.index + currentMatch.value[0].length).trim();
    }

    result.push({
      id: parseInt(id),
      text: text
    });

    currentMatch = nextMatch;
  }

  return result;
}

String.prototype.replaceAt = function (index, replacement) {
  return (
    this.substr(0, index) +
    replacement +
    this.substr(index + replacement.length)
  );
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTexts(cues) {
  let cuesTextList = "";
  for (let i = 0; i < cues.length; i++) {
    if (cues[i].text[cues[i].text.length - 1] == ".") {
      cues[i].text = cues[i].text.replaceAt(
        cues[i].text.length - 1,
        ". "
      );
    }
    cuesTextList += `id-${cues[i].id} ${cues[i].text.replace(/\n/g, " ")} `;
  }
  return cuesTextList;
}

function getTranslation(words, callback) {
  chrome.storage.sync.get(["lang"], function (result) {
    let lang = result.lang;
    const xhr = new XMLHttpRequest();
    let url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURI(
      words
    )}`;
    xhr.open("GET", url, true);
    xhr.responseType = "text";
    xhr.onload = function () {
      if (xhr.readyState === xhr.DONE) {
        if (xhr.status === 200 || xhr.status === 304) {
          const translatedList = JSON.parse(xhr.responseText)[0];
          let translatedTextArray = [];
          for (let i = 0; i < translatedList.length; i++) {
            translatedTextArray.push(translatedList[i][0]);
          }
          let translatedText = translatedTextArray.join(" ");
          callback(translatedText);
        }
      }
    };
    xhr.send();
  });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.method == "translate") {
    openBilingual();
  }
});
