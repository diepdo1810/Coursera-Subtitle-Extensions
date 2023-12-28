const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

async function openBilingual() {
  let video = document.getElementById('vjs_video_3_html5_api');
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
      console.log(cuesTextList);
      // let translatedText = await translateAndDisplay(cuesTextList);
      const phrases = document.querySelectorAll('.phrases .rc-Phrase');

      // Duyệt qua từng phần cần dịch
      phrases.forEach((phrase, index) => {
        // console.log(phrase);
        // Lấy nội dung và data-cue-index
        // const text = phrase.textContent.trim();
        const text = phrase.firstElementChild.textContent.trim();
        const cueIndex = phrase.getAttribute('data-cue-index');
        console.log(text, cueIndex);
        // Gọi API dịch với text

        // Sau khi nhận được phản hồi từ API, đồng bộ hóa với video sử dụng cueIndex
      });
      let displayQueue = [];

      video.addEventListener('timeupdate', function () {
        const currentTime = video.currentTime;
        // Kiểm tra xem có đoạn văn bản mới cần hiển thị không
        for (let i = 0; i < cues.length; i++) {
          const cue = cues[i];
          if (currentTime >= cue.startTime && currentTime <= cue.endTime && !isCueInQueue(cue, displayQueue)) {
            displayQueue.push({ id: cue.id, text: cue.text, startTime: cue.startTime, endTime: cue.endTime });
          }
        }

        // Hiển thị đoạn văn bản trong hàng đợi nếu đến thời điểm hiển thị
        while (displayQueue.length > 0 && currentTime >= displayQueue[0].startTime) {
          const cue = displayQueue.shift();

          displayTextSegment(cue.text);
        }
      });
    }
  }
}
function displayTextSegment(text) {
  // Hiển thị đoạn văn bản trong giao diện người dùng (có thể sử dụng translateAndDisplay nếu cần dịch)
  // console.log(text);
}

function isCueInQueue(cue, queue) {
  return queue.some(item => item.startTime === cue.startTime && item.endTime === cue.endTime);
}
async function translateAndDisplay(text) {
  return new Promise(async (resolve) => {
    await getTranslation(text, (translatedText) => {
      // console.log(translatedText);
      // Hiển thị kết quả dịch tương ứng với đoạn văn bản
      resolve();
    });
  });
}

// Hàm chia nhỏ đoạn văn bản thành các đoạn nhỏ
function splitTextIntoSegments(text, segmentLength) {
  const segments = [];
  for (let i = 0; i < text.length; i += segmentLength) {
    segments.push(text.slice(i, i + segmentLength));
  }
  return segments;
}

function parseTextWithIds(input) {
  const regex = /id-(\d+)\s*([\s\S]*?)(?=(id-\d+|$))/g;
  const matches = [...input.matchAll(regex)];

  const output = matches.map(match => {
    const id = parseInt(match[1]);
    const text = match[2].trim();
    return { id, text };
  });

  return output;
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

function getTextSegmentAtTime(translatedText) {
  // Tách các đoạn văn bản đã dịch
  const textSegments = translatedText.split('id-');
  console.log(textSegments);

  // // Xác định đoạn văn bản tương ứng với thời gian hiện tại
  // for (let i = 1; i < textSegments.length; i++) {
  //   const segment = textSegments[i];
  //   const idIndex = segment.indexOf(' ');
  //   const id = segment.slice(0, idIndex);
  //   const content = segment.slice(idIndex + 1);

  //   // Tính thời điểm bắt đầu và kết thúc của cue tương ứng
  //   const startTime = parseFloat(id.split('-')[1]);
  //   const endTime = i < textSegments.length - 1 ? parseFloat(textSegments[i + 1].split('-')[1]) : Infinity;

  //   // Nếu thời điểm hiện tại nằm trong khoảng của cue, trả về nội dung của cue đó
  //   if (currentTime >= startTime && currentTime < endTime) {
  //     return content;
  //   }
  // }

  // // Trường hợp không tìm thấy đoạn nào, trả về chuỗi trống
  // return '';
}

let textSegments = [];

function getTexts(cues) {
  let cuesTextList = "";
  for (let i = 0; i < cues.length; i++) {
    // Lưu thông tin của từng dòng văn bản vào mảng
    const textSegment = {
      id: i + 1,
      originalText: cues[i].text,
      translatedText: "", // Sẽ được cập nhật khi dịch
    };

    textSegments.push(textSegment);

    // Thêm id vào trước mỗi dòng văn bản
    cuesTextList += `${textSegment.originalText.replace(/\n/g, " ")} `;
  }

  return cuesTextList;
}

function getTranslations(words, callback) {
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
const MODEL_NAME = "gemini-pro";
const API_KEY = "AIzaSyCCmu9BSsF-lMSg6jeh9fRlXQSL6BiGGJY";
async function getTranslation(words, callback) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 3048,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const parts = [
    { text: "I want you to play the role of a translator, spell checker, and Vietnamese corrector. I'll talk to you in any language and you'll detect it, translate it, and reply with a revised and improved Vietnamese version of my text. I want you to rewrite complex words and sentences into simpler Vietnamese words and sentences that are easier to understand. Keep the same meaning, but make it more transparent, clear and specific. Keep text ID all, no break line. All output shall be in Vietnamese The text to translate is this:\n" + words },
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  const response = result.response;
  callback(response.text());
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.method == "translate") {
    openBilingual();
  }
});
