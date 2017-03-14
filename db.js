/*
 ****************************************************************************************************************
 *                                      Initialize database connection                                          *
 ****************************************************************************************************************
 */
var mysql = require("mysql");
var fs = require('fs');
//Create connection to database
var con = mysql.createConnection({
  host: "us-cdbr-iron-east-03.cleardb.net",
  user: "b6e5d333d4e527",
  password: "c361531b",
  database: 'heroku_c451f9968c9a788'
});
//Connect to database
con.connect(function(err){
  if(err){
    console.log('Error connecting to db');
    return;
  }
  console.log('Connection established');
});

/*
 ****************************************************************************************************************
 *                         Public methods which will be exported to other files                                 *
 ****************************************************************************************************************
 */

/**
 * Re-activate a user who is banned previously. This operation must be done by an admin.
 *
 * @param  activatorID User ID of the admin
 * @param  userID      User ID of the user who will be re-activated
 * @param  callback    A callback function for this method
 */
exports.ActiveUser = function(activatorID, userID, callback){
  con.query('SELECT isAdmin FROM User WHERE userID = ?' , [activatorID], function(err, rows) {
    if(!err){
      var checkisAdmin = rows[0].isAdmin;
    }
    if (checkisAdmin == '1'){
      con.query("UPDATE User SET isBanned=0 WHERE userID = '"+ userID+"'",function(err){
        if(!err){
          console.log('Active Success');
          callback(0);
        }
        else{
          console.log(err);
          console.log('Active Error');
          callback(-1);
        }    
      });
    }
    else{
      console.log("you are not an admin");
      callback(1);
    }
  });
};

/**
 * Accept a tutor application and authorize the user to become a tutor. This operation could only be done by an
 * admin.
 *
 * @param  courseID Course ID shown in the tutor application   
 * @param  userID   User ID of the user who will become a tutor
 * @param  adminID  User ID of the admin
 * @param  callback A callback function for this method
 */
exports.Authorize = function(courseID, userID, adminID, callback){
  con.query('SELECT isAdmin FROM User WHERE userID = ?' , [adminID], function(err, rows) {
    if(rows.length == 0){
      console.log("Admin not found!");
      callback(-1);
      return;
    }
    if(!err){
      var checkisAdmin = rows[0].isAdmin;
    }
    else{
      console.log("admin check error");
      console.log(err);
      callback(-1);
      return;
    }
    con.query("SELECT * FROM TutorApplication WHERE userID = ? AND courseID = ?", [userID, courseID], function(err, rows) {
      if(!err){
        if(rows.length == 0){
          console.log("Tutor application not found!");
          callback(-1);
          return;
        }
        if (checkisAdmin == '1'){
          var row = {courseID:courseID,userID:userID};
          con.query('INSERT INTO Tutor SET ?', row);
          con.query('UPDATE TutorApplication SET accepted = 1 WHERE userID = ? AND courseID = ?', [userID, courseID], function(err){
            if(!err){
              console.log("accepted tutor");
              createTutorDescription(courseID, userID);
              callback(0);
            }
            else{
              console.log(err);
              callback(-1);
            }
          });
        }
        else{
          console.log('You are not an admin');
          callback(1);
        }
      }
      else{
        console.log(err);
        callback(-1);
      }
    });
  });
};

/**
 * Ban a user. This operation could only be done by an admin.
 *
 * @param  bannerID User ID of the admin
 * @param  userID   User ID of the user who will be re-activated
 * @param  callback A callback function for this method
 */
exports.BanUser = function(bannerID, userID, callback){
  con.query('SELECT isAdmin FROM User WHERE userID = ?' , [bannerID], function(err, rows) {
    if(!err){
      var checkisAdmin = rows[0].isAdmin;
    }
    if (checkisAdmin == '1'){
      con.query("UPDATE User SET isBanned=1 WHERE userID = '"+ userID+"'",function(err){
        if(!err){
          console.log('Ban Success');
          callback(0);
        }
        else{
          console.log(err);
          console.log('Ban Error');
          callback(-1);
        }    
      });
    }
    else{
      console.log("you are not an admin");
      callback(1);
    }
  });
};

/**
 * Let a user change his/her e-mail address and keywords.
 *
 * @param  userID    User ID of the current user 
 * @param  emailAddr E-mail address of the user
 * @param  keywords  Keywords of the user
 * @param  callback  A callback function for this method
 */
exports.ChangePersonalInfo = function(userID, emailAddr, keywords, callback){
  var words = [];
  for(var i=0;i<3;i++){
    words.push('NULL');
  }
  var split = keywords.split(", ");
  for(var i=0;i<3;i++){
    if(split[i]=="" || split[i]==undefined){
      continue;
    }
    words[i] = "'" + split[i] + "'";
  }
  var sql = "UPDATE User SET emailAddr = '"+emailAddr+"', keyword1 = "+words[0]+", keyword2 = "+words[1]+", keyword3 = "+words[2]+" WHERE userID = '"+userID+"';";
  con.query(sql,function(err, rows) {
   if(!err){
     console.log("Update success");
     callback(0);
   }
   else{
     console.log("Fail to update personal information!");
     callback(-1);
   }
 });
};

/**
 * Delete an answer from a post. This operation could only be done by an admin.
 *
 * @param  answerID Answer ID of the answer which will be deleted
 * @param  userID   User ID of the admin
 * @param  callback A callback function for this method
 */
exports.deleteAnswer = function(answerID, userID, callback){
  con.query('SELECT isAdmin FROM User WHERE userID = ?' , [userID], function(err, rows) {
    if(!err){
      if(rows.length == 0){
        console.log("Admin not found!");
        callback(-1);
        return;
      }
      var checkisAdmin = rows[0].isAdmin;
    }
    else{
      console.log("Error while checking admin");
      callback(-1);
      return;
    }
    if (checkisAdmin == '1'){
      con.query('DELETE FROM Answer WHERE answerID = ?' , [answerID], function(err, rows) {
        if(!err){
          console.log('answerID: ' + answerID +' has been deleted!');
          callback(0);
        }
        else{
          console.log("Error deleting Answer");
          callback(-1);
        }
      });
    }
    else{
      console.log('You are not an admin!');
      callback(1);
    }
  });
};

/**
 * Delete a post. This operation could only be done by an admin.
 *
 * @param  res      A response to the server
 * @param  req      A request for the server
 * @param  postID   Post ID of the post which will be deleted
 * @param  userID   User ID of the admin
 * @param  callback A callback function for this method
 */
exports.deletePost = function(res, req, postID, userID, callback){
  con.query('SELECT isAdmin FROM User WHERE userID = ?' , [userID], function(err, rows) {
    if(!err){
      if(rows.length == 0){
        console.log("Admin not found!");
        callback(-1);
        return;
      }
      var checkisAdmin = rows[0].isAdmin;
    }
    else{
      console.log("Error while checking admin");
      callback(-1);
      return;
    }
    if (checkisAdmin == '1'){
      con.query('DELETE FROM Post WHERE postID = ?' , [postID], function(err, rows) {
        if(!err){
          console.log('postID: ' + postID +' has been deleted!');
          callback(0);
          res.redirect('/adminposts');
        }
        else{
          console.log("Error deleting post");
          callback(-1);
        }
      });
    }
    else{
      console.log('You are not an admin');
      callback(1);
      res.redirect('/adminposts');
    }
  });
};

/**
 * Given the Post ID of a post, find its related posts by its keywords. Show only maximum three records.
 *
 * @param  postID   Post ID of the given post
 * @param  callback A callback function for this method
 */
exports.FindRelatedPostByPostIDLimit3 = function(postID, callback){
  var qc = "";
  qc += "SELECT p.postID, p.title FROM Keyword k1, Keyword k2, Post p\n";
  qc += "WHERE ((k1.firstKeyword = k2.firstKeyword OR k1.firstKeyword = k2.secondKeyword OR k1.firstKeyword = k2.thirdKeyword OR k1.firstKeyword = k2.fourthKeyword OR k1.firstKeyword = k2.fifthKeyword)\n";
  qc += "OR (k1.secondKeyword = k2.firstKeyword OR k1.secondKeyword = k2.secondKeyword OR k1.secondKeyword = k2.thirdKeyword OR k1.secondKeyword = k2.fourthKeyword OR k1.secondKeyword = k2.fifthKeyword)\n";
  qc += "OR (k1.thirdKeyword = k2.firstKeyword OR k1.thirdKeyword = k2.secondKeyword OR k1.thirdKeyword = k2.thirdKeyword OR k1.thirdKeyword = k2.fourthKeyword OR k1.thirdKeyword = k2.fifthKeyword)\n";
  qc += "OR (k1.fourthKeyword = k2.firstKeyword OR k1.fourthKeyword = k2.secondKeyword OR k1.fourthKeyword = k2.thirdKeyword OR k1.fourthKeyword = k2.fourthKeyword OR k1.fourthKeyword = k2.fifthKeyword)\n";
  qc += "OR (k1.fifthKeyword = k2.firstKeyword OR k1.fifthKeyword = k2.secondKeyword OR k1.fifthKeyword = k2.thirdKeyword OR k1.fifthKeyword = k2.fourthKeyword OR k1.fifthKeyword = k2.fifthKeyword))\n";
  qc += "AND (k1.postID = "+postID+" AND k2.postID = p.postID AND k2.postID != "+postID+") ORDER BY p.date DESC LIMIT 3;";
  con.query(qc, function(err, rows) {
   if(!err){
     if(rows.length==0){
       callback(0);
       return;
     }
     callback(rows);
   }
   else{
     console.log(err);
     console.log("Error while FindRelatedPostByPostID");
     callback(-1);
   }
 });
};

/**
 * Get Post ID and title for all posts. This operation could only be done by an admin.
 *
 * @param  res            A response to the server
 * @param  req            A request for the server
 * @param  administration A variable used to verify whether this operation is done by an admin
 * @param  callback       A callback function for this method
 */
exports.getAllPost = function(res, req, administration, callback){
  con.query("SELECT postID, title FROM Post;",function(err, rows) {
    if(!err){
      if (rows.length==0){
        callback(0);
      }
      res.render('admin_posts', { 
        post_list: rows,
        ThisUser: req.session.user_id,
        Administration: administration,
      });
    }
    else{
     console.log(err);
     callback(-1);
   }
 });
};

/**
 * List all User IDs of all users. This operation could only be done by an admin.
 *
 * @param  administration A variable used to verify whether this operation is done by an admin
 * @param  res            A response to the server
 * @param  req            A request for the server
 * @param  callback       A callback function for this method
 */
exports.getAllUserAllInfo = function(administration, req, res, callback){
  con.query("SELECT userID from User;", function(err, rows) {
   if(!err){
     res.render('message_send', { ThisUser: req.session.user_id , contact_table: rows, Administration: administration});
   }
   else{
     console.log(err);
     callback(-1);
   }
 });
};

/**
 * List all User IDs and ban-status of all users. This operation could only be done by an admin.
 *
 * @param  res            A response to the server
 * @param  req            A request for the server
 * @param  administration A variable used to verify whether this operation is done by an admin
 * @param  callback       A callback function for this method
 */
exports.getAllUserBannedInfo = function(res, req, administration, callback){
  con.query("SELECT userID, isBanned from User",function(err, rows) {
   if(!err){
     if(rows.length==0){
      callback("No results!");
      return;
    }
    res.render('admin_users', { user_list: rows,
      ThisUser: req.session.user_id,
      Administration: administration,
    });
  }
  else{
   console.log(err);
   callback(-1);
 }
});
};

/**
 * Get keywords and E-mail addresss of the current user.
 *
 * @param  administration A variable used to verify whether this operation is done by an admin (not necessary)
 * @param  userID         User ID of the current user
 * @param  res            A response to the server
 * @param  callback       A callback function for this method
 */
exports.getKeywordAndEmail = function(administration, userID, res, callback){
  con.query("SELECT keyword1, keyword2, keyword3, emailAddr FROM User WHERE userID = ?", [userID], function(err, rows) {
     if(!err){
       if(rows.length==0){
         callback(-1);
       }
       var str = "";
       if(rows[0].keyword1 == null || rows[0].keyword1 == undefined){
         
       }
       else{
         str += rows[0].keyword1;
       }
       if(rows[0].keyword2 == null || rows[0].keyword2 == undefined){
         
       }
       else{
         str +=", "+rows[0].keyword2;
       }
       if(rows[0].keyword3 == null || rows[0].keyword3 == undefined){
         
       }
       else{
         str +=", " + rows[0].keyword3;
       }
       rows[0].keywords = str;
       console.log(rows);
       res.render('setting', { ThisUser: userID , receiver: rows, Administration: administration});
       
     }else{
       callback(-1);
     }
  });
};

/**
 * Insert an answer for a post.
 *
 * @param  userID   User ID of the current user
 * @param  postID   Post ID of the current post
 * @param  content  Content of the new answer
 * @param  callback A callback function for this method
 */
exports.InsertAnswer = function(userID, postID, content, callback){
    var maxAnswerID;
    con.query('SELECT MAX(answerID) AS maxid FROM Answer;', function(err, rows) {
        if(!err){
            maxAnswerID = parseInt(rows[0].maxid, 10) + 1;
            if(isNaN(maxAnswerID)){
              maxAnswerID = 0;
            }
            con.query("SELECT isBanned AS ban from User WHERE userID = '"+userID+"';", function(err3, rows3) {
                if(!err3){
                    if(rows3.length == 0){
                        console.log('Invalid userID!');
                        return callback(-1);
                    }
                    if(rows3[0].ban == '1'){
                        console.log('User '+ userID + ' is banned, he/she is not allowed to answer');
                        return callback(1);
                    }
                    else{
                        createAnswer(postID, maxAnswerID, content);
                        var now = getCurrentDate();
                        var qc = "INSERT INTO Answer (answerID, postID, userID, likeNum, dislikeNum, date)"; 
                        qc += " VALUES ("+maxAnswerID+", "+postID+", '"+userID+"', 0, 0, '"+now+"');";
                        con.query(qc, function(err2, rows2) {
                            if(!err2){
                                console.log('Successfully add new answer');
                                return callback(0);
                            }
                            else{
                                console.log(err2);
                                return callback(-1);
                            }
                        });
                    }
                }
                else{
                    console.log(err3);
                    console.log('Invalid userID!');
                    return callback(-1);
                }
            });
        }
        else{
            console.log(err);
            console.log('Error while performing Query.');
        }
    });
};

/**
 * Insert a Post.
 *
 * @param  userID   User ID of the current user
 * @param  title    Title of the new post
 * @param  content  Content of the new post
 * @param  keywords Keywords of the new post
 * @param  callback A callback function for this method
 */
exports.InsertPost = function(userID, title, content, keywords, callback){
    var maxPostID;
    con.query('SELECT MAX(postID) AS maxid FROM Post;', function(err, rows) {
        if(!err){
            maxPostID = parseInt(rows[0].maxid, 10) + 1;
            if(isNaN(maxPostID)){
              maxPostID = 0;
            }
            con.query("SELECT isBanned AS ban from User WHERE userID = '"+userID+"';", function(err3, rows3) {
                if(!err3){
                    if(rows3.length == 0){
                        console.log('Invalid userID!');
                        return callback(-1);
                    }
                    if(rows3[0].ban == '1'){
                        console.log('User '+ userID + ' is banned, he/she is not allowed to post');
                        return callback(1);
                    }
                    else{
                        createPost(maxPostID, content);
                        var now = getCurrentDate();
                        var qc = "INSERT INTO Post (postID, likeNum, dislikeNum, userID, title, date)"; 
                        qc += "VALUES ("+maxPostID+", 0, 0, '"+userID+"', '"+title+"', '"+now+"');";
                        con.query(qc, function(err2, rows2) {
                            if(!err2){
                                InsertKeywordForPost(maxPostID, keywords);
                                console.log('Successfully add new post');
                                return callback(0);
                            }
                            else{
                                console.log(err2);
                                return callback(-1);
                            }
                        });
                    }
                }
                else{
                    console.log(err3);
                    console.log('Invalid userID!');
                    return callback(-1);
                }
            });
        }
        else{
            console.log(err);
            console.log('Error while performing Query.');
        }
    });
};

/**
 * Given a pair of User ID and password, decide whether they match each others. If yes, let the user login to
 * the server.
 *
 * @param  userID   The given User ID
 * @param  password The given password
 * @param  callback A callback function for this method
 */
exports.login = function(userID, password, callback){
  con.query("SELECT userID, password FROM User WHERE userID = ? AND password = ?" ,[userID, password] , function(err, rows){
  if (!err){
    console.log(rows);
    if (rows.length > 0){
      console.log("userID and password matched");
      return callback(0);
    }
    else{
      console.log("Wrong userID or password!");
      return callback(-1);
    }
  }
  else{
    console.log(err);
    console.log('Error while performing select query.');
  }
  });
};

/**
 * Register a new user to the server.
 *
 * @param  userID    User ID of the new user
 * @param  password  Password of the new user
 * @param  emailAddr E-mail address of the new user
 * @param  year      Study year of the new user
 */
exports.Register = function(req, res, userID, password, emailAddr, year){
   var qc = "INSERT INTO User (userID, password, isAdmin, emailAddr, isBanned, year, keyword1, keyword2,keyword3)";
   qc += " VALUES ('"+userID+"', '"+password+"', 0, '"+emailAddr+"', 0, "+year+", 'Java', 'C++', 'CSCI3100');";
   console.log(qc);
   con.query(qc, function(err, rows){
   if (!err){
     createUserFolder(userID);
   }
   else{
     console.log(err);
     console.log('Error while performing Register Query.');
  }
  });
};

/**
 * Reject a tutor application. This operation could only be done by an admin.
 *
 * @param  courseID Course ID of the course shown in the tutor application
 * @param  userID   User ID of the user who sends the application
 * @param  adminID  User ID of the admin
 * @param  callback A callback function for this method
 */
exports.RejectTutorApplication = function(courseID, userID, adminID, callback){
  con.query('SELECT isAdmin FROM User WHERE userID = ?' , [adminID], function(err, rows) {
      if(rows.length == 0){
        console.log("Admin not found!");
        callback(-1);
        return;
      }
      if(!err){
        var checkisAdmin = rows[0].isAdmin;
      }
      else{
        console.log("admin check error");
        console.log(err);
        callback(-1);
        return;
      }
      if (checkisAdmin == '1'){
        con.query('UPDATE TutorApplication SET rejected = 1 WHERE userID = ? AND courseID = ?', [userID, courseID], function(err){
          if(!err){
            console.log("rejected tutor");
            callback(0);
          }
          else{
            console.log(err);
            callback(-1);
          }
        });
      }
      else{
        console.log('You are not an admin');
        callback(1);
      }
  });
};

/**
 * Get the information about all answers sent by a certain user.
 *
 * @param  userID   The given User ID
 * @param  callback A callback function for this method
 */
exports.RequestAnswerByUserID = function(userID, callback){
  con.query('SELECT answerID, postID FROM Answer WHERE userID = ? ORDER BY answerID ASC;', [userID], function(err, rows){
    if (!err){
            var counter = 0;
            if(rows.length==0){
              callback("No results!");
              return;
            }
            for (var i in rows){
                  fs.readFile('./answer/post' + rows[i].postID + '/' + rows[i].answerID, function(err, data){
                  if (err) throw err;
                  data = data.toString();
                  rows[counter].data = data;
                  
                  if(counter==rows.length-1){
                    callback(rows);
                  }
                  counter++;
                });
            }
            
        }
        else{
            console.log(err);
            callback(-1);
        }
  });
};

/**
 * Get the information about all answers of a post.
 *
 * @param  postID   The given Post ID
 * @param  callback A callback function for this method
 */
exports.RequestAnswerInfoByPostID = function(postID, callback){
  con.query('SELECT answerID, userID, date FROM Answer WHERE postID= ? ORDER BY likeNum, date DESC',[postID], function(err, rows) {
     if (!err){
            var counter = 0;
            if(rows.length==0){
              callback(0);
              return;
            }
            for (var i in rows){
                  fs.readFile('./answer/post' + postID + '/' + rows[i].answerID, function(err, data){
                  if (err) throw err;
                  data = data.toString();
                  rows[counter].date = date2String(rows[counter].date);
                  rows[counter].data = data;
                  if(counter==rows.length-1){
                    callback(rows);
                  }
                  counter++;
                });
            }
            
        }
        else{
            console.log(err);
            callback(-1);
        }
  });
};

/**
 * Get the question feed for a user according to his/her keywords
 *
 * @param  userID   The given User ID
 * @param  callback A callback function for this method
 */
exports.RequestFeedByID = function(userID, callback){
  var qc = "";
  qc += "SELECT p.postID, p.title from Post p, User u, Keyword k\n";
  qc += "WHERE ((u.keyword1 = k.firstKeyword OR u.keyword1 = k.secondKeyword OR u.keyword1 = k.thirdKeyword OR u.keyword1 = k.fourthKeyword OR u.keyword1 = k.fifthKeyword)\n";
  qc += "OR (u.keyword2 = k.firstKeyword OR u.keyword2 = k.secondKeyword OR u.keyword2 = k.thirdKeyword OR u.keyword2 = k.fourthKeyword OR u.keyword2 = k.fifthKeyword)\n";
  qc += "OR (u.keyword3 = k.firstKeyword OR u.keyword3 = k.secondKeyword OR u.keyword3 = k.thirdKeyword OR u.keyword3 = k.fourthKeyword OR u.keyword3 = k.fifthKeyword))\n";
  qc += "AND (k.postID = p.postID AND u.userID = '"+userID+"') LIMIT 3;";
  con.query(qc, function(err, rows) {
     if(!err){
       if(rows.length==0){
         callback(0);
         return;
       }
       callback(rows);
     }
     else{
       console.log("Error while RequestFeedByKeyword");
       callback(-1);
     }
  });
};

/**
 * Show all messages for the current user from his/her inbox.
 *
 * @param  administration A variable used to verify whether this operation is done by an admin (not necessary)
 * @param  userID         User ID of the current user
 * @param  res            A response to the server
 * @param  callback       A callback function for this method
 */
exports.RequestMessageBoxByUserID = function(administration, userID, res, callback){
  con.query('SELECT * FROM Messages WHERE receiverID = ? ORDER BY date DESC;', [userID], function(err, rows){
    if (!err){
            console.log(rows);
            if(rows.length==0){
              callback(0);
            }
            res.render('message_receive', { ThisUser: userID , receiver: rows, Administration: administration});
        }
        else{
            console.log(err);
            callback(-1);
        }
  });
};

/**
 * Show all post in descending date order.
 *
 * @param  callback A callback function for this method
 */
exports.RequestPostByDate = function(callback){
    con.query("SELECT postID, title, userID FROM Post ORDER BY date DESC;" , function(err, rows) {
        if(!err){
            if(rows.length == 0){
              callback(0);
              return;
            }
            var counter = 0;
            for (var i in rows){
                fs.readFile('./post/' + rows[i].postID, function(err, data){
                  if (err) throw err;
                  data = data.toString();
                  rows[counter].data = data;
                  rows[counter].imgPath = "/profile/"+rows[counter].userID+"/profileImage.png";
                  if(counter==rows.length-1){
                    callback(rows);
                  }
                  counter++;
                });
            }
        }
        else{
            console.log(err);
            callback(-1);
        }
    });
};

/**
 * Get all post information sent by a certain user.
 *
 * @param  userID   The given User ID
 * @param  callback A callback function for this method
 */
exports.RequestPostByID = function(userID, callback){
    con.query("SELECT postID FROM Post WHERE userID = ? ORDER BY date DESC;" , [userID], function(err, rows) {
        if(!err){
          var counter = 0;
          if(rows.length==0){
            callback("No results!");
            return;
          }
          for (var i in rows){
            fs.readFile('./post/' + rows[i].postID, function(err, data){
              if (err) throw err;
              data = data.toString();
              rows[counter].data = data;
              if(counter==rows.length-1){
                callback(rows);
              }
              counter++;
            });
          }
        }
        else{
            console.log(err);
            callback(-1);
        }
    });
};

/**
 * Show all post in descending like number order.
 *
 * @param  callback A callback function for this method
 */
exports.RequestPostByLikeNum = function(callback){
  con.query('SELECT postID, title, userID, likeNum FROM Post ORDER BY likeNum DESC', function(err, rows) {
      if(!err){
        var counter = 0;
        for(var i in rows){
          fs.readFile('./post/' + rows[i].postID, function(err, data){
          if (err) throw err;
          data = data.toString();
          rows[counter].data = data;
          if(counter==rows.length-1){
             callback(rows);
             return;
           }
           counter++;
         });
       }
      }
      else{
        console.log(err);
        console.log("Request Post By Like Number Error!");
        callback(-1);
      }
  });
};

/**
 * Get the detailed information of a post by given its Post ID.
 *
 * @param  postID   The given Post ID
 * @param  callback A callback function for this method
 */
exports.RequestPostInfoByPostID = function(postID, callback){
  con.query('SELECT title, userID, date FROM Post WHERE postID = ?;', [postID], function(err, rows){
    if (!err){
            if(rows.length==0){
              callback("No results!");
              return;
            }
            fs.readFile('./post/' + postID, function(err, data){
              if (err) throw err;
              data = data.toString();
              rows[0].date = date2String(rows[0].date);
              rows[0].data = data;
              callback(rows);
            });
            
        }
        else{
            console.log(err);
            callback(-1);
        }
  });
};

/**
 * Get all post titles sent by a certain user.
 *
 * @param  userID   The given User ID
 * @param  callback A callback function for this method
 */
exports.RequestPostTitleByID = function(userID, callback){
    con.query("SELECT postID, title FROM Post WHERE userID = ? ORDER BY date DESC LIMIT 3;" , [userID], function(err, rows) {
        if(!err){
          if(rows.length==0){
            callback(0);
            return;
          }
          callback(rows);
        }
        else{
            console.log(err);
            callback(-1);
        }
    });
};

/**
 * Show all post titles in descending like number order.
 *
 * @param  callback A callback function for this method
 */
exports.RequestPostByKeyword = function(keyword, callback){
  con.query('SELECT p.postID, p.title, p.userID FROM Post p, Keyword k WHERE k.firstKeyword = ? AND p.postID = k.postID OR k.secondKeyword = ? AND p.postID = k.postID OR k.thirdKeyword = ? AND p.postID = k.postID OR k.fourthKeyword = ? AND p.postID = k.postID OR k.fifthKeyword = ? AND p.postID = k.postID' , [keyword, keyword, keyword, keyword, keyword], function(err, rows){
    if(!err){
      var counter = 0;
      if(rows.length==0){
        callback(rows);
        return;
      }
      for (var i in rows){
          fs.readFile('./post/' + rows[i].postID, function(err, data){
            if (err) throw err;
            data = data.toString();
            rows[counter].data = data;
            rows[counter].imgPath = "/profile/"+rows[counter].userID+"/profileImage.png";
            if(counter==rows.length-1){
              callback(rows);
            }
            counter++;
          });
      }
    }
    else{
      console.log(err);
      callback(-1);
    }
  });
};

/**
 * Show all post titles in descending like number order. Show only maximum three records.
 *
 * @param  callback A callback function for this method
 */
exports.RequestPostTitleByLikeNumLimit3 = function(callback){
  con.query('SELECT postID, title, likeNum FROM Post order by likeNum DESC Limit 3', function(err, rows) {
      if(!err){
       callback(rows);
      }
      else{
        console.log("Request Post By Like Number Error!");
        callback(-1);
      }
  });
};

/**
 * Get the titles of all posts that a certain user has answered
 *
 * @param  userID   The given User ID
 * @param  callback A callback function for this method
 */
exports.RequestPostTitleofAnswerByUserID = function(userID, callback){
  con.query('SELECT p.title, a.answerID, p.postID, a.date FROM Answer a, Post p WHERE a.postID = p.postID AND a.userID = ? ORDER BY a.date DESC LIMIT 3;', [userID], function(err, rows){
    if (!err){
      if(rows.length==0){
        callback(0);
        return;
      }
      callback(rows);
    }
    else{
      console.log(err);
      callback(-1);
    }
  });
};

/**
 * List all tutors who teach a certain course
 *
 * @param  req      A request for the server
 * @param  res      A response to the server
 * @param  courseID The given Course ID
 * @param  callback A callback function for this method
 */
exports.SearchTutor = function(req, res, courseID, callback){
  con.query("SELECT userID, courseID FROM Tutor WHERE courseID = '" + courseID+"'",function(err, rows){
    if(!err){
      if(rows.length==0){
        callback(0);
        res.render('tutor_page', { ThisUser: req.session.user_id , tutors: rows});
        return;
      }
      var counter = 0;
        for(var i in rows){
          fs.readFile('./tutorDescription/'+courseID+"/"+rows[i].userID+".txt", function(err, data){
          if (err) throw err;
          data = data.toString();
          rows[counter].data = data;
          if(counter==rows.length-1){
             res.render('tutor_page', { ThisUser: req.session.user_id , tutors: rows});
             return;
           }
           counter++;
         });
       }
    }
  else{
    console.log(err);
    callback(-1);
  }
  });
};

/**
 * Let User1 send a message to User2.
 *
 * @param  userID1  User ID of the sender
 * @param  userID2  User ID of the receiver
 * @param  subject  Subject of the message
 * @param  content  Content of the message
 * @param  callback A callback function for this method
 */
exports.SendMessage = function(userID1, userID2, subject, content, callback){
  con.query('SELECT isBanned FROM User WHERE userID = ?' ,[userID1], function(err1, rows){
    if(!err1){
      if(rows.length == 0){
        console.log("User not found!");
        callback(-1);
        return;
      }
      else{
        var number = rows[0].isBanned;
        if(number==1){
          console.log("User is banned! Cannot send message!");
          callback(1);
          return;
        }
        con.query('SELECT MAX(messageID) AS hh FROM Messages',function(err,num){
          if(!err){
            var maxmessage ;
            maxmessage =  num[0].hh + 1;
            var now = getCurrentDate();
            console.log(now);
            var row = {messageID:maxmessage,subject:subject,content:content,senderID:userID1,receiverID:userID2,date:now};
            con.query('INSERT INTO Messages SET ?', row, function(err){
              if(!err){
                createMessage(maxmessage,content);
                console.log('insert message success');
                callback(0);
              }
              else{
                console.log(err);
                console.log('insert message err');
                callback(-1);
              }    
            });
          } 
          else{
            console.log("select maxmessage error");
            console.log(err);
            callback(-1);
          }
        });
      }
    }
    else{
      console.log("Insert message error");
      callback(-1);
    }
  });
};

/**
 * Show all tutor applications which are currently neither accepted nor rejected. This operation could only be done
 * by an admin.
 *
 * @param  res            A response to the server
 * @param  req            A request for the server
 * @param  administration A variable used to verify whether this operation is done by an admin
 * @param  callback       A callback function for this method
 */
exports.ShowAllApplications = function(res, req, administration, callback){
  con.query("SELECT userID, courseID FROM TutorApplication WHERE rejected = 0 AND accepted = 0;",function(err, rows) {
     if(!err){
        res.render('admin_tutors', { ThisUser: req.session.user_id , tutor_table: rows, Administration: administration});
     }
     else{
       console.log(err);
       callback(-1);
     }

  });
};

/**
 * Show the content of a certain tutor application. This operation could only be done by an admin.
 *
 * @param  userID   User ID of the user who sent the application
 * @param  courseID Course ID of the course shown in the application
 * @param  callback A callback function for this method
 */
exports.ShowApplicationContent = function(userID, courseID, callback){
  con.query("SELECT * FROM TutorApplication WHERE userID = ? AND courseID = ?", [userID,courseID], function(err, rows) {
     if(!err){
        var counter = 0;
        var str = "";
        for(var i in rows){
          fs.readFile('./tutorApplication/'+userID+"_"+courseID+"/application.txt", function(err, data){
          if (err) throw err;
          data = data.toString();
          str += data;
          if(counter==rows.length-1){
             callback(str);
             return;
           }
           counter++;
         });
       }
      }
      else{
        console.log(err);
        console.log("ShowApplicationContent Error!");
        callback(-1);
      }
  });
};

/**
 * Show the User IDs of all banned users.
 *
 * @param  callback A callback function for this method
 */
exports.showBannedUser = function(callback){
  con.query('SELECT userID FROM User WHERE isBanned = 1', function(err, rows) {
    if(!err){
      if(rows.length==0){
        callback('No results!');
        return;
      }
      callback(rows);
    }
  else{
    console.log(err);
    callback(-1);
  }
  });
};

/**
 * Show the description content of a tutor according from a certain tutor application. This operation could only be 
 * done by an admin.
 *
 * @param  userID   User ID of the user who sent the application
 * @param  courseID Course ID of the course shown in the application
 * @param  callback A callback function for this method
 */
exports.ShowDescriptionContent = function(userID, courseID, callback){
  con.query("SELECT * FROM TutorApplication WHERE userID = ? AND courseID = ?", [userID,courseID], function(err, rows) {
     if(!err){
        var counter = 0;
        var str = "";
        for(var i in rows){
          fs.readFile('./tutorApplication/'+userID+"_"+courseID+"/description.txt", function(err, data){
          if (err) throw err;
          data = data.toString();
          str += data;
          if(counter==rows.length-1){
             callback(str);
             return;
           }
           counter++;
         });
       }
      }
      else{
        console.log(err);
        console.log("ShowDescriptionContent Error!");
        callback(-1);
      }
  });
};

/**
 * Show all messages between two users in date ascending order.
 *
 * @param  userID1  User ID of the first user
 * @param  userID2  User ID of the second user
 * @param  callback A callback function for this method
 */
exports.showMessageBetweenTwoUsers = function(userID1, userID2, callback){
  con.query("SELECT senderID, receiverID, messageID, date FROM innodb.Messages where (senderID = ? AND receiverID = ?) OR (senderID = ? AND receiverID = ?) ORDER BY date ASC", [userID1,userID2,userID2,userID1], function(err, rows) {
      if(!err){
            var counter = 0;
            if(rows.length==0){
              callback("No results!");
              return;
            }
            for (var i in rows){
                  fs.readFile('./message/' + rows[i].messageID + ".txt", function(err, data){
                  if (err) throw err;
                  data = data.toString();
                  rows[counter].date = date2String(rows[counter].date);
                  rows[counter].data = data;
                  
                  if(counter==rows.length-1){
                    callback(rows);
                  }
                  counter++;
                });
            }
            
        }
        else{
            console.log(err);
            callback(-1);
        }
  });
};

/**
 * Show all tutor information. This operation could only be done by an admin.
 *
 * @param  administration A variable used to verify whether this operation is done by an admin (not necessary)
 * @param  req            A request for the server
 * @param  res            A response to the server
 * @param  callback       A callback function for this method
 */
exports.ShowTutor = function(administration, req, res, callback){
  con.query("SELECT userID, courseID FROM Tutor;",function(err, rows){
    if(!err){
      if(rows.length==0){
        callback("No results!");
        return;
      }
      var counter = 0;
        for(var i in rows){
          fs.readFile('./tutorDescription/'+rows[i].courseID+"/"+rows[i].userID+".txt", function(err, data){
          if (err) throw err;
          data = data.toString();
          rows[counter].data = data;
          if(counter==rows.length-1){
            console.log(rows);
            res.render('tutor_page', { ThisUser: req.session.user_id, tutors: rows, Administration: administration});
            return;
          }
           counter++;
         });
       }
    }
  else{
    console.log(err);
    callback(-1);
  }
  });
};

/**
 * Let a user send a tutor application.
 *
 * @param  userID      User ID of the current user
 * @param  courseID    Course ID of the course which the user wants to teach
 * @param  application Content of this application
 * @param  des         Description of the user
 * @param  callback    A callback function for this method
 */
exports.TutorApplication = function(userID, courseID, application, des, callback){
  var qc = "Insert Into TutorApplication (userID, courseID, rejected, accepted)\n";
  qc += "VALUES ('"+userID+"', '"+courseID+"', 0, 0);";
  con.query(qc, function(err, rows) {
     if(!err){
       createTutorApplication(userID, courseID, application, des);
       console.log("Successfully send tutor application!");
       callback(1);
     }
     else{
       callback(-1);
     }
  });
};

/*
 ****************************************************************************************************************
 *                                               Local functions                                                *
 ****************************************************************************************************************
 */

/**
 * Create a file for a new answer to store its content.
 *
 * @param  postID   Post ID of the post which the new answer belongs to
 * @param  answerID Answer ID of the new answer
 * @param  content  Content of the new answer
 */
function createAnswer(postID, answerID, content){
    var dir = "./";
    dir = dir + "answer/post" + postID + "/";
    try {
        fs.mkdirSync(dir);
        console.log("out");
    } catch(e) {
        if ( e.code != 'EEXIST' ) throw e;
    }
    fs.writeFile("./answer/post" + postID + "/" + answerID, content, function(err) {
        if(err) {
            return console.log(err);
        }
    
        console.log("The file was saved!");
    }); 
}

/**
 * Create a file for a new message to store its content.
 *
 * @param  messageID Message ID of the new message 
 * @param  content   Content of the new message
 */
function createMessage(messageID, content){
    var dir = "./";
    dir = dir + "message/";
    try {
        fs.mkdirSync(dir);
        console.log("out");
    } catch(e) {
        if ( e.code != 'EEXIST' ) throw e;
    }
    fs.writeFile("./message/" + messageID + ".txt", content, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    }); 
}

/**
 * Create a file for a new post to store its content.
 *
 * @param  postID  Post ID of the new post 
 * @param  content Content of the new post
 */
function createPost(postID, content){
    fs.writeFile("./post/" + postID, content, function(err) {
        if(err) {
            return console.log(err);
        }
    
        console.log("The file was saved!");
    }); 
}

/**
 * Create a file for a new tutor application to store its application and description content.
 *
 * @param  userID      User ID of the user who wants to become a tutor
 * @param  courseID    Couser ID of the course which the user wants to teach
 * @param  application Content of the new tutor application
 * @param  description Description of the user who wants to be a tutor
 */
function createTutorApplication(userID, courseID, application, description){
    var dir = "./";
    dir = dir + "tutorApplication/"+userID+"_"+courseID;
    try {
        fs.mkdirSync(dir);
        console.log("out");
    } catch(e) {
        if ( e.code != 'EEXIST' ) throw e;
    }
    fs.writeFile("./tutorApplication/"+userID+"_"+courseID+"/" +"application.txt", application, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("Application was saved!");
        fs.writeFile("./tutorApplication/"+userID+"_"+courseID+"/" +"description.txt", description, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("Description was saved!");
    }); 
    });
}

/**
 * When an admin has authorized a user to become a tutor, this function will copy the tutor's description file to
 * a new directory for further usage.
 *
 * @param  courseID Couser ID of the course which the user wants to teach
 * @param  userID   User ID of the user who wants to become a tutor
 */
function createTutorDescription(courseID, userID){
  var dir = "./";
    dir = dir + "tutorDescription/"+courseID + "/";
    try {
        fs.mkdirSync(dir);
        console.log("out");
    } catch(e) {
        if ( e.code != 'EEXIST' ) throw e;
    }
    fs.createReadStream("./tutorApplication/"+userID+"_"+courseID+"/description.txt").pipe(fs.createWriteStream("./tutorDescription/"+courseID+"/"+userID+".txt"));
    console.log("File is saved!");
}

/**
 * Create a folder for a new user to store his/her information
 *
 * @param  userID User ID of the new user
 */
function createUserFolder(userID){
  var dir = './profile/'+userID;
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
  fs.createReadStream("./img/team-01.gif").pipe(fs.createWriteStream("./profile/"+userID+"/profileImage.png"));
}

/**
 * Given a date object, convert it to a string in the format "yyyy-mm-dd hh:mm:ss" and return this string.
 *
 * @param  date The given date object
 * @return      The string that converted from the given date object
 */
function date2String(date){
    var today = date;
    var time = today.getTime();
    var offset = today.getTimezoneOffset();
    time = time + offset;
    today = new Date(time);
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
    var hh = today.getHours();
    var m = today.getMinutes();
    var ss = today.getSeconds();
    
    if(dd<10) {
        dd='0'+dd;
    } 

    if(mm<10) {
        mm='0'+mm;
    }
    
    if(hh<10) {
        hh='0'+hh;
    }
    
    if(m<10) {
        m='0'+m;
    }
    
    if(ss<10) {
        ss='0'+ss;
    } 

    today = yyyy+'-'+mm+'-'+dd+' '+hh+':'+m+':'+ss;
    return today;
}

/**
 * Return the current time in UTC time zone as a string with the format "yyyy-mm-dd hh:mm:ss".
 *
 * @return  The string which represents the current UTC time
 */
function getCurrentDate(){
    var today = new Date();
    var time = today.getTime();
    var offset = today.getTimezoneOffset();
    time = time + offset;
    today = new Date(time);
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
    var hh = today.getHours();
    var m = today.getMinutes();
    var ss = today.getSeconds();
    
    if(dd<10) {
        dd='0'+dd;
    } 

    if(mm<10) {
        mm='0'+mm;
    }
    
    if(hh<10) {
        hh='0'+hh;
    }
    
    if(m<10) {
        m='0'+m;
    }
    
    if(ss<10) {
        ss='0'+ss;
    } 

    today = yyyy+'-'+mm+'-'+dd+' '+hh+':'+m+':'+ss;
    return today;
}

/**
 * Insert keywords for a newly created post.
 *
 * @param  postID   Post ID of the newly created post
 * @param  keywords Kewords that will be inserted to the post
 */
function InsertKeywordForPost(postID, keywords){
  console.log(keywords);
  var words = [];
  for(var i=0;i<5;i++){
    words.push('NULL');
  }
  var split = keywords.split(", ");
  for(var i=0;i<5;i++){
    if(split[i]=="" || split[i]==undefined){
      continue;
    }
    words[i] = "'" + split[i] + "'";
  }
  var sql = "Insert into Keyword (postID, firstKeyword, secondKeyword, thirdKeyword, fourthKeyword, fifthKeyword) \n";
  sql += "VALUES ("+postID+", "+words[0]+", "+words[1]+", "+words[2]+", "+words[3]+", "+words[4]+");";
  console.log(sql);
  con.query(sql,function(err, rows) {
      if(!err){
        console.log("Successfully add keywords");
      }
      else{
        console.log(err);
      }
  });
}