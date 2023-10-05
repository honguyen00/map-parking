saveButton.addEventListener("click", function(event) {
    event.preventDefault();
    
    var studentGrade = {
      student: student.value,
      grade: grade.value,
      comment: comment.value.trim()
    };
    
    localStorage.setItem("studentGrade", JSON.stringify(studentGrade));
    renderMessage();
    
    });
    
    function renderMessage() {
      var lastGrade = JSON.parse(localStorage.getItem("studentGrade"));
      if (lastGrade !== null) {
        document.querySelector(".message").textContent = lastGrade.student + 
        " received a/an " + lastGrade.grade
      }
    }

    //When the user clicks on search input, 
    //The last 8 search history will appear underneath the search bar.

    //When the user types anything in the search input,
    //The search history will disappear, and the autocomplete will kick in. 

    //When the user types in an address, and clicks on Search,
    //The address will be saved in local storage as the latest search history. 