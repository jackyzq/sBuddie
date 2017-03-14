/*
 ****************************************************************************************************************
 *                                              Required Packages                                               *
 ****************************************************************************************************************
 */
var db = require("./db.js");
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var jade = require('jade');
var fs = require('fs');
var path = require('path');
var multer = require('multer');

/*
 ****************************************************************************************************************
 *                                                  Jade setup                                                  *
 ****************************************************************************************************************
 */

app.set('view engine', 'jade');

app.use(session({
  secret: 'ajieojf',
  resave: false,
  saveUninitialized: false
}));

app.use(bodyParser.urlencoded({ extended: true }));

/*
 ****************************************************************************************************************
 *                                              Get and Post Methods                                            *
 ****************************************************************************************************************
 */
 
/*
 * Index Page calls index.html
 */ 
app.get('/', function(req, res){
  if (req.session.user_id){
    res.redirect("/home/" + req.session.user_id);
    return;
  }
  var options = {
    root: __dirname 
  };
  var fileName = "index.html";
  res.sendFile(fileName, options, function(err){
    if (err) {
      console.log(err);
      res.status(err.status).end();
    }
    else {
      console.log('Sent:', fileName);
    }
  });
});

/**
 * Sends function register upon request from browser and calls database function
 */

app.post('/register', function (req, res) {
  var post = req.body;
  if (post.passwordsignup === post.passwordsignup_confirm) {
    res.redirect('/login');
    db.Register(req, res, post.usernamesignup, post.passwordsignup, post.emailsignup, post.yearsignup);
  } else{
    res.send('Unsuccessful Register');
  }
});

/*
 * Response for login page.
 */
app.get('/login', function(req, res){
  var options = {
    root: __dirname 
  };
  var fileName = "login.html";
  res.sendFile(fileName, options, function(err){
    if (err) {
      console.log(err);
      res.status(err.status).end();
    }
    else {
      console.log('Sent:', fileName);
    }
  });
});

/*
 * Sends function register upon request from browser and calls database function
 */
app.post('/login', function(req, res){
  var post = req.body;
  db.login(post.username, post.password, function(response){
    console.log(response);
    if(response == 0){
      console.log("Login Successful");
      req.session.user_id = post.username;
      res.redirect("/home/" + post.username);
    }
    else{
      var options = {
        root: __dirname 
      };
      var fileName = "invalid.html";
      res.sendFile(fileName, options, function(err){
        if (err){
          console.log(err);
          res.status(err.status).end();
        }
        else{
          console.log('Sent:', fileName);
        }
      });
    }
  });
});

/*
 * Homepage after login
 */
app.get('/home/:para', function(req, res) {
  var Question;
  var Feedpost;
  var Likenum;
  var Answer;
  var Myquestion;
  var myUser = req.session.user_id;
  var administration;
  if (myUser == "admin"){
    administration = 1;
  }
  else {
    administration = 0;
  }
  if ( (req.session.user_id) === req.params.para){
    db.RequestPostTitleByID((req.session.user_id), function(response){
      if (response == -1){
        res.send("RequestPostTitleByID error");
      }
      else{
        Myquestion = response;
      }
    });
    db.RequestPostByDate(function(response){
      if (response == -1){
        res.send("RequestPostByDate error");
      }
      else{
        Question = response;
      }
      db.RequestPostTitleByLikeNumLimit3(function(response){
        if (response == -1){
          res.send("RequestPostByLikeNum error");
        }
        else{
          Likenum = response;
        }
      });
      db.RequestFeedByID((req.session.user_id), function(response){
        if (response == -1){
          res.send("RequestFeedByID error");
        }
        else{
          Feedpost = response;
        }
      });
      db.RequestPostTitleofAnswerByUserID((req.session.user_id),function(response){
        if (response == -1){
          res.send("RequestPostTitleofAnswerByUserID");
        }
        else{
          Answer = response;
          res.render('home', {question: Question, feedpost: Feedpost, likenum: Likenum, answer: Answer, myquestion: Myquestion, ThisUser: myUser, Administration: administration});
        }
      });
    });
  }
  else{
    res.send('Bad user/pass'); 
  }
});

/*
 * Home page ordered by most popular
 */
app.get('/home_popular/:para', function(req, res) {
  var Question;
  var Feedpost;
  var Likenum;
  var Answer;
  var Myquestion;
  var myUser = req.session.user_id;
  var administration;
  if (myUser == "admin"){
    administration = 1;
  }
  else {
    administration = 0;
  }
  if ( (req.session.user_id) === req.params.para){
    db.RequestPostTitleByID((req.session.user_id), function(response){
      if (response == -1){
        res.send("RequestPostTitleByID error");
      }
      else{
        Myquestion = response;
      }
    });
    db.RequestPostByLikeNum(function(response){
      if (response == -1){
        res.send("RequestPostByLikeNum error");
      }
      else{
        Question = response;
      }
      db.RequestPostTitleByLikeNumLimit3(function(response){
        if (response == -1){
          res.send("RequestPostByLikeNum error");
        }
        else{
          Likenum = response;
        }
      });
      db.RequestFeedByID((req.session.user_id), function(response){
        if (response == -1){
          res.send("RequestFeedByID error");
        }
        else{
          Feedpost = response;
        }
      });
      db.RequestPostTitleofAnswerByUserID((req.session.user_id),function(response){
        if (response == -1){
          res.send("RequestPostTitleofAnswerByUserID");
        }
        Answer = response;
        res.render('home', {question: Question, feedpost: Feedpost, likenum: Likenum, answer: Answer, myquestion: Myquestion, ThisUser: myUser, Administration: administration});
      });
    });
  }
  else{
    res.send('Bad user/pass');     
  }
});

/*
 * Homepage ordered by search criteria
 */
app.get('/sendmessage/:para', function(req, res) {
  var Question;
  var Feedpost;
  var Likenum;
  var Answer;
  var Myquestion;
  var myUser = req.session.user_id;
  var administration;
  if (myUser == "admin"){
    administration = 1;
  }
  else {
    administration = 0;
  }
  if ( (req.session.user_id) === req.params.para){
    db.RequestPostTitleByID((req.session.user_id), function(response){
      if (response == -1){
        res.send("RequestPostTitleByID error");
      }
      else{
        Myquestion = response;
      }
    });
    db.RequestPostByKeyword(req.session.keyword, function(response){
      if (response == -1){
        res.send("RequestPostByKeyword error");
      }
      else{
        Question = response;
      }
      db.RequestPostTitleByLikeNumLimit3(function(response){
        if (response == -1){
          res.send("RequestPostByLikeNum error");
        }
        else{
          Likenum = response;
        }
      });
      db.RequestFeedByID((req.session.user_id), function(response){
        if (response == -1){
          res.send("RequestFeedByID error");
        }
        else{
          Feedpost = response;
        }
      });
      db.RequestPostTitleofAnswerByUserID((req.session.user_id),function(response){
        if (response == -1){
          res.send("RequestPostTitleofAnswerByUserID");
        }
        Answer = response;
        res.render('home', {question: Question, feedpost: Feedpost, likenum: Likenum, answer: Answer, myquestion: Myquestion, ThisUser: myUser, Administration: administration});
      });
    });
  }
  else{
    res.send('Bad user/pass');     
  }
});

/*
 * Action of the search textbox in the header of all pages.
 */
app.post("/search_post", function(req, res){
  var post = req.body;
  req.session.keyword = post.keyword;
  res.redirect('/home_search/'+ req.session.user_id);
});

/*
 * Ask Question function parameter is the postID number
 * Question page with the answers given a specific postID
 */
app.get('/question/:para', function(req, res){
  var thisUser = req.session.user_id;
  var postID = req.params.para;
  var related;
  var post;
  var answer;
  db.FindRelatedPostByPostIDLimit3(postID, function(response){
    if(response == -1){
      res.send("FindRelatedPostByPostID error");
    }
    else{
      related = response;
    }
  });
  db.RequestPostInfoByPostID(postID, function(response){
    if(response == -1){
      res.send("RequestPostInfoByPostID error");
    }
    else if(response == 0){
      res.send("No results!");
    }
    else{
      console.log(response);
      post = response;
    }
  });
  db.RequestAnswerInfoByPostID(postID, function(response){
    if(response == -1){
      res.send("RequestAnswerInfoByPostID error");
    }
    else if(response == 0){
      answer = [];
      res.render('answer_page', { Related: related, Post: post, Postanswer: answer, ThisUser: thisUser, PostID: postID});
    }
    else{
      answer = response;
      res.render('answer_page', { Related: related, Post: post, Postanswer: answer, ThisUser: thisUser, PostID: postID});
    }
  });
});

/*
 * Question page inserting an answer for a specific postID and answer content
 */
app.post("/answer", function(req, res){
  var post = req.body;
  db.InsertAnswer(post.userID, post.postID, post.Answer, function(response){
    if (response == 0){
      console.log("Insert Answer Success");
      res.redirect('/question/' + post.postID);
    }
    else if (response == 1){
      var options = {
        root: __dirname 
      };
      var fileName = "banned.html";
      res.sendFile(fileName, options, function(err){
        if (err) {
          console.log(err);
          res.status(err.status).end();
        }
        else {
          console.log('Sent:', fileName);
        }
      });
    }
    else{
      res.send("Insert Answer Unsuccessful");
    }
  });
});

/*
 * Ask page when clicking on Ask Question in menu bar
 */
app.get('/ask', function(req, res){
  var myUser = req.session.user_id;
  var theUser = req.session.user_id;
  var administration;
  if (theUser == "admin"){
    administration = 1;
  }
  else {
    administration = 0;
  }
  res.render('ask', {
    ThisUser: myUser,
    Administration: administration
  });
});

/*
 * ask page submit button. User can specify the title keyword and question they want to ask
 */
app.post("/insert_post", function(req, res){
  var post = req.body;
  db.InsertPost(req.session.user_id, post.title, post.content, post.keywords, function(response){
    if (response == 0){
      console.log("Insert Post Success");
      res.redirect('/home/' + req.session.user_id);
    }
    else if (response == 1){
      var options = {
        root: __dirname 
      };
      var fileName = "banned.html";
      res.sendFile(fileName, options, function(err){
        if (err) {
          console.log(err);
          res.status(err.status).end();
        }
        else {
          console.log('Sent:', fileName);
        }
      });
    }
    else{
      res.send("InsertPost Unsuccessful");
    }
  });
});

/*
 * Message inbox, calls db function to get by userID specified in parameter
 */
app.get('/message_receive/:para',function(req, res){
  var theUser = req.session.user_id;
  var administration;
  if (theUser == "admin"){
    administration = 1;
  }
  else {
    administration = 0;
  }
  db.RequestMessageBoxByUserID(administration, (req.session.user_id), res, function(response){
    if (response == -1){
      res.send("RequestFeedByID error");
    }
  });
});

/*
 * Send message page. Calls to database for all the user information.
 */
app.get('/message_send/:para', function(req, res){
  var theUser = req.session.user_id;
  var administration;
  if (theUser == "admin"){
    administration = 1;
  }
  else {
    administration = 0;
  }
  db.getAllUserAllInfo(administration, req, res, function(response){
    if (response == -1){
      res.send("RequestFeedByID error");
    }
  });
});

/**
 * send message to receiver specified in parameter get page
 */
app.get('/message/:para', function(req, res){
  var myUser = req.session.user_id;
  var administration;
  if (myUser == "admin"){
    administration = 1;
  }
  else {
    administration = 0;
  }
  res.render('message', {
    ThisUser: myUser,
    Receiver: req.params.para,
    Adminitration: administration,
  });
});

/**
 * send message to receiver specified in parameter post function
 */  
app.post('/sendmessage', function(req, res){
  var myUser = req.session.user_id;
  var post = req.body;
  db.SendMessage(myUser, post.Receiver, post.subject_content, post.message_content, function(response){
    if (response == -1){
      res.send("Receiver name is not a user");
    }
    else{
      res.redirect('/message_send/' + myUser);
    }
  });
});

/**
 * Calls database for all the tutors and display.
 */
app.get('/tutors', function(req, res){
  var theUser = req.session.user_id;
  var administration;
  if (theUser == "admin"){
    administration = 1;
  }
  else {
    administration = 0;
  }
  db.ShowTutor(administration, req, res, function(response){
    if (response == -1){
      res.send("ShowTutor error");
    }
  });
});

/**
 * Search for a tutor based on their CourseID on tutor page
 */
app.post('/search_tutors', function(req, res){
  var post = req.body;
  db.SearchTutor(req, res, post.courseID, function(response){
    if (response == -1){
      console.log("RequestPostInfoByPostID error");
    }
  });
});

/**
 * Apply to tutor button on tutor page. Renders the application page.
 */
app.get('/apply_tutor', function(req, res){
  var myUser = req.session.user_id;
  res.render("tutorapply", {ThisUser: myUser});
});

/**
 * Submission of the tutorapplication
 */
app.post("/TutorApplication", function(req, res) {
  var post = req.body;
  db.TutorApplication(req.session.user_id, post.courseID, post.application, post.des, function(response){
    console.log(post.application);
    if(response == -1){
      res.send("TutorApplication error");
    }
    else{
      res.redirect("tutors");
    }
  });
});

/**
 * Setting page and parameter specifies the user.
 */
app.get('/setting/:para', function(req, res){
  var theUser = req.session.user_id;
  var administration;
  if (theUser == "admin"){
    administration = 1;
  }
  else {
    administration = 0;
  }
  db.getKeywordAndEmail(administration, theUser, res, function(response){
    if (response == -1){
      console.log("getKeywordAndEmail error");
    }
  });
});

/**
 * Submit button for changing setting information
 */
app.post('/changesetting', function(req, res){
  var thisUser = req.session.user_id;
  var post = req.body;
  db.ChangePersonalInfo(thisUser, post.email, post.keywords, function(response){
    if (response == -1){
      console.log("Error Changing personal info");
    }
    else{
      res.redirect('/setting/'+ thisUser);
    }
  });
});

/**
 * Submit button for changing profile picture
 */
app.post('/upload', function(req, res){
  var storage =   multer.diskStorage({
    destination: function(req, file, callback){
      callback(null, './profile/'+ req.session.user_id);
    },
    filename: function(req, file, callback){
      var arr = file.mimetype.split('/');
      callback(null, file.fieldname + '.png');
    }
  });
  var upload = multer({ storage : storage}).single('profileImage');
  upload(req,res,function(err){
      if(err) {
          return res.end("Error uploading file.");
      }
      res.redirect("/setting/" + req.session.user_id);
  });
});

/**
 * default admin page. Displays all users and whether they are banned and ban operations
 */
app.get('/adminusers', function(req, res){
  var theUser = req.session.user_id;
  var administration;
  if (theUser == "admin"){
    administration = 1;
  }
  else {
    administration = 0;
  }
  db.getAllUserBannedInfo(res, req, administration, function(response){
    if (response == -1){
      console.log("getAllUserBannedInfo error");
    }
  });
});

/**
 * ban operation in adminusers page
 */
app.post('/banUser', function (req, res) {
  var post = req.body;
  db.BanUser(post.adminID,post.userID, function(response){
    res.redirect("/adminusers");
  });
});

/**
 * unban operation in adminusers page
 */
app.post('/unbanUser', function (req, res) {
  var post = req.body;
  db.ActiveUser(post.adminID,post.userID, function(response){
    res.redirect("/adminusers");
  });
});

/**
 * admin tutors page that shows all tutor applications
 */
app.get('/admintutors', function(req, res){
  var theUser = req.session.user_id;
  var administration;
  if (theUser == "admin"){
    administration = 1;
  }
  else {
    administration = 0;
  }
  db.ShowAllApplications(res, req, administration, function(response) {
    if (response == -1){
      console.log("ShowAllApplications error");
    }
  });
});

/**
 * admin tutors operation that shows a specific tutors description
 */
app.post('/getDescription', function (req, res) {
  var post = req.body;
  db.ShowDescriptionContent(post.tutor_id,post.course_id, function(response){
    res.send(response);
  });
});

/**
 * admin tutors operation that shows a specific tutors application
 */
app.post('/getApplication', function (req, res) {
  var post = req.body;
  db.ShowApplicationContent(post.tutor_id,post.course_id, function(response){
    res.send(response);
  });
});

/**
 * admin tutors operation for approving the application
 */
app.post('/approveApplication', function(req, res){
  var post = req.body;
  db.Authorize(post.course_id, post.tutor_id, post.admin_id, function(response){
    res.redirect('/admintutors');
  });
});

/**
 * admin tutors operation for deleting the application and rejecting it
 */
app.post('/deleteApplication', function(req, res){
  var post = req.body;
  db.RejectTutorApplication(post.course_id, post.tutor_id, post.admin_id, function(response){
    res.redirect('/admintutors');
  });
});

/**
 * admin posts page
 */
app.get('/adminposts', function(req, res){
  var theUser = req.session.user_id;
  var administration;
  if (theUser == "admin"){
    administration = 1;
  }
  else {
    administration = 0;
  }
  db.getAllPost(res, req, administration, function(response) {
    if (response == -1){
      console.log("getAllpost error");
    }
  });
});

/**
 * deletes the corresponding post from the adminposts page
 */
app.get("/deletePost/:para", function(req, res){
  db.deletePost(res, req, req.params.para, req.session.user_id, function(response){
    if (response == -1){
      res.send("delete Post error");
    }
    else if (response == 1){
      res.send("User is not authorized to delete post.");
    }
  });
});

/**
 * Logout deletes session key
 */
app.get('/logout', function (req, res) {
  delete req.session.user_id;
  res.redirect('/');
});

/**
 * error page used for unusual behaviour
 */
app.get('/error_page', function(req, res){
  var options ={
    root: __dirname 
  };
  var fileName = "error_page.html";
  res.sendFile(fileName, options, function(err){
    if (err){
      console.log(err);
      res.status(err.status).end();
    }
    else {
      console.log('Sent:', fileName);
    }
  });
});

/**
 * route handler
 */
app.use(express.static(__dirname));

var util = require('util');
var exec = require('child_process').exec;
var output;
function puts(error, stdout, stderr){
  if (error){
    console.error(error, stderr);
    return;
  }
}

/**
 * error handler
 */

app.get('*', function(req, res, next){
  var err = new Error();
  err.status = 404;
  next(err);
});
 
// handling 404 errors
app.use(function(err, req, res, next){
  if(err.status !== 404) {
    return next();
  }
  res.redirect("/error_page")
});

/**
 * listener setup
 */
 
app.listen(process.env.PORT || 8080, function (){
  console.log('Example app listening on port 8080!');
});