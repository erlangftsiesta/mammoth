let questionIndex = 1;

document
  .getElementById("uploadForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:7771/convert", {
        method: "POST",
        body: formData,
      });

      const html = await response.text();
      const outputDiv = document.getElementById("output");

      const resultDiv = document.createElement("div");
      resultDiv.innerHTML = html;

      const listItems = resultDiv.querySelectorAll("ol li, ul li");
      let answerIndex = 0;
      const labels = ["A", "B", "C", "D", "E"];
      let currentSoal = null;

      listItems.forEach((item, index) => {
        const listAnswerDiv = document.createElement("div");
        listAnswerDiv.classList.add("list-answer");

        if (index % 6 === 0) {
          const soalText = item.innerHTML;
          item.id = `soal-${questionIndex}`;

          const soalP = document.createElement("p");
          soalP.id = item.id;
          soalP.innerHTML = soalText;

          item.innerHTML = "";
          item.appendChild(soalP);

          questionIndex += 1;
          answerIndex = 0;
          currentSoal = item;
        } else {
          const radioLabel = document.createElement("label");
          radioLabel.classList.add("radio-label");

          const radioInput = document.createElement("input");
          radioInput.type = "radio";
          radioInput.name = `jawaban-${questionIndex - 1}`;
          radioInput.classList.add("radio-input");
          radioInput.value = labels[answerIndex];

          listAnswerDiv.innerHTML = item.innerHTML;
          item.innerHTML = "";
          item.appendChild(listAnswerDiv);

          radioLabel.appendChild(radioInput);
          radioLabel.appendChild(listAnswerDiv);

          currentSoal.appendChild(radioLabel);
          answerIndex += 1;
        }
      });

      outputDiv.appendChild(resultDiv);

      fileInput.value = "";
    }
  });

document
  .getElementById("saveForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const soalInput = document.getElementById("soal");
    const soal = soalInput.value;
    const answers = [];
    const images = [];
    const radioInputs = document.querySelectorAll(".radio-input");

    // Function to get all src of img tags within a div with the class list-answer inside each label of a question
    const getImageAnswerURIs = (questionId) => {
      const uris = [];
      const questionElement = document.querySelector(`#${questionId}`);
      if (questionElement) {
        const answerElements = questionElement.querySelectorAll("label");
        answerElements.forEach((label) => {
          const answerDiv = label.querySelector(".list-answer");
          if (answerDiv) {
            const imgTag = answerDiv.querySelector("img");
            if (imgTag) {
              uris.push(imgTag.getAttribute("src"));
            }
          }
        });
      }
      return uris;
    };

    // Example usage within a loop
    const allImageURIs = [];
    for (let i = 1; i < questionIndex; i++) {
      const questionId = `soal-${i}`;
      const imgURIs = getImageAnswerURIs(questionId);
      if (imgURIs.length > 0) {
        // console.log(
        //   `Image URIs in list-answer for question ${questionId}:`,
        //   imgURIs
        // );
        allImageURIs.push(...imgURIs); // Collect all image URIs into one array
      } else {
        console.log(`No image found in list-answer for question ${questionId}`);
      }
    }
    //=======================================================================================

    const getImageAnswerURI = (questionId) => {
      const questionElement = document.querySelector(`#${questionId}`);
      if (questionElement) {
        const answerElement = questionElement.querySelector(".list-answer");
        if (answerElement) {
          const imgTag = answerElement.querySelector("img");
          if (imgTag) {
            return imgTag.getAttribute("src");
          }
        }
      }
      return null;
    };
    //=======================================================================================
    for (let i = 1; i < questionIndex; i++) {
      const tagP = document.querySelector(`p#soal-${i}`);

      if (tagP) {
        //=======================================================================================
        function getImageQuestionURI(element) {
          const imgTag = element.querySelector("img");
          if (imgTag) {
            return imgTag.getAttribute("src");
          }
          return null;
        }

        const imgURI = getImageQuestionURI(tagP);
        //=======================================================================================
        //=======================================================================================
        function removeImgAndBrFromP(element) {
          Array.from(element.children).forEach((child) => {
            if (child.tagName === "IMG" || child.tagName === "BR") {
              element.removeChild(child);
            }
          });
        }
        removeImgAndBrFromP(tagP);

        const nilaiTagP = tagP.textContent.trim();
        //=======================================================================================
        const checkedRadio = document.querySelector(
          `input[name='jawaban-${i}']:checked`
        );
        if (checkedRadio) {
          const answerText = checkedRadio.nextSibling.textContent.trim(); // Mengambil teks dari sibling dari checkedRadio
          const alphabetRadio = checkedRadio.value;
          //=======================================================================================
          if (imgURI === null) {
            const receiveObject = {
              mapel: soal,
              question_id: tagP.id,
              question_text: nilaiTagP,
              answer_text: answerText,
              answer_alphabet: alphabetRadio,
              questionImage: imgURI,
              arrayAnswerImages: null,
            };
            console.log(`ID Tag <p>: ${tagP.id}`);
            console.log(`Nilai dari Tag <p>: ${nilaiTagP}`);
            console.log(`Value Radio Checked: ${answerText}`);
            console.log(`Alphabet Radio Checked: ${alphabetRadio}`);
            console.log(`URL GAMBAR SOAL-${i}: ${imgURI}`);
            console.log(`ARRAY URL GAMBAR JAWABAN: `, null);
            answers.push(receiveObject);
          } else {
            const arrayAnswerImagess = JSON.stringify({ data: allImageURIs });
            const receiveObject = {
              mapel: soal,
              question_id: tagP.id,
              question_text: nilaiTagP,
              answer_text: answerText,
              answer_alphabet: alphabetRadio,
              questionImage: imgURI,
              arrayAnswerImages: arrayAnswerImagess,
            };
            console.log(`ID Tag <p>: ${tagP.id}`);
            console.log(`Nilai dari Tag <p>: ${nilaiTagP}`);
            console.log(`Value Radio Checked: ${answerText}`);
            console.log(`Alphabet Radio Checked: ${alphabetRadio}`);
            console.log(`URL GAMBAR SOAL-${i}: ${imgURI}`);
            console.log(`ARRAY URL GAMBAR JAWABAN: `, allImageURIs);
            answers.push(receiveObject);
          }
          //=======================================================================================
        }
      }
    }
    // Kirim data menggunakan fetch
    const response = await fetch("/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answers }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.text();
    alert(result);

    soalInput.value = "";
    radioInputs.forEach((input) => {
      input.checked = false;
    });
  });
