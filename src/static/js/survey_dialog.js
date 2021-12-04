var feedbackButton = document.getElementById('givingFeedback');
var surveyDialog = document.getElementById('surveyDialog');
var outputBox = document.querySelector('output');
var selectEl = document.querySelector('select');
var confirmBtn = document.getElementById('confirmBtn');
var cancelButton = document.getElementById('cancelBtn');

// "Giving Feedback" button opens the <dialog> modally
feedbackButton.addEventListener('click', function onOpen() {
  if (typeof surveyDialog.showModal === "function") {
    surveyDialog.showModal();
  } else {
    alert("The <dialog> API is not supported by this browser");
  }
});

$(document).on('submit','#survey-form',function(e) {
    console.log('hello');
    console.log($("#sentiment").val());

    e.preventDefault(); 
    $.ajax({
        type:'POST', 
        url:'/',
        data:{
            sentiment:$("#sentiment").val(),
            policy:$("#policy").val(),
            easy:$("#easy").val(),
            innovative:$("#innovative").val(),
            informative:$("#informative").val(),
            vizualise:$("#vizualise").val()
        },
        success:function() {
            alert('Thank you for your feedback!');
            closeDialog();
        }
    })
}); 

cancelButton.addEventListener('click', function() {
    closeDialog();
});

function closeDialog() {
    surveyDialog.close();
}
