/* final_proj.js */
/* ****************************************************************************************************************
** Javascript and jQuery functions implementing 3 main functions:
** 1) Form validation for User Login and home address completion
**      - username and passwords are required
**      - email address is optional but if entered it will be validated for correct pattern
**      - Home address is optional but if street # and/or name are entered, the zip code become mandatory
**           The adress is completed via google GEO API 
** 2) Film information gathering and displaying of plot overview, actors & directors Bio's.
** 3) LocalStorage capability is used to store login info with name "usersStorage"
** 4) LocalStorage is also used to store Film Info for registered users. 1 Table per user with
**      name: "filmCollection"+username.
**
**         KEY CSCI E-3 FEATURES implemented in this app:
**  
**          1) FORM VALIDATION: 
**          Form Validation and (hopefully) improved User Experience: Show/Hide form fields as part of validation
**          logic. For example: start with username and password 1, if both have a valid range, show the confirm
**          password for new users. If user already registered, display uname at top right and retrieve his/her
**          Film List for display
**          For new users that pass the username/password validation, display next login info block: email/address
**          input fields... email is optional but needs to be validated against a valid pattern
**          Address is optional but ZIP code is required if a street name is entered. the rest of address is generated
**          using google geo API.
**
**          2) CAPTURING AND HANDLING EVENTS:
**          Event handling is used throughout for both user login functionality and Film Info display
**
**         3) DOM Manipulation and element creation:
**          Film Display Table uses DOM element creation to dynamically create rows for new saved films
** 
**         4) CLOSURES:
**          Used in the $('#bio').click((function() {} to circulate through displaying BIO for the different Film
**          Directors and Actors of the latest Film Enquiry.
** 
**        5) AJAX is heavily used to collect address information and Film Info from the IMDB web site.
**            To avoid Cross Origin Conflict, I decided to use the YQL Proxy where all the AJAX requests/responses
**            go through YQL (Yahoo free Proxy Service). A jQuery plugin (jquery.xdomainajax.js) was adopted for this.
**
**     
**      Requirements for succesfully running this app: localhost or running from a web server.
**
**      I have installed the latest on fpe3.silvousplais.biz for convenience.
**
**      I decided not to include any other mobile and/or bootstrap library and just rely on what we
**      learned in this course. As a result, this app will not run on a mobile device or iPad.
*/ 

$(document).ready(function(){

      var localStoreUsers = "usersStorage";
      var users = new Array;
      // filmCollection of all actor info entries
      var filmCollection = [];
      
      var movieInfo;

      $('body').css('backgroundImage', 'url('+'images/Collector.jpg'+')');

      // Retrieve the list current users from localStorage
      function getLocalStoreUsers() {
            var storedCollection = window.localStorage.getItem(localStoreUsers);
            if (storedCollection) {
                  return JSON.parse(storedCollection);
            }
            else {
                  return [];
            } 
      }
      // get list of films previously stored in local storage for this username
      function retrieveFilmInfo(username) {
            var storedCollection = window.localStorage.getItem('filmCollection-'+username);
            if (storedCollection) {
                  return JSON.parse(storedCollection);
            }
            else {
                  return []; // no film info was previously stored for this user
            } 
      }
      // initialize users.
      users = getLocalStoreUsers(); 
      // contructor for user login info Object containing relevant info per user.
      function UserLoginInfo(username, password,street,address,email,status) {
            this.username = username;
            this.password = password;
            this.street = street;
            this.address = address;
            this.email = email;
            this.newUser = status; // this is a flag to indicate whether this current user in newly added or not
      }
      // This function displays the user information on demand at upper right hand side of page
      function displayLogin(data) {
            var detailedInfo = document.getElementById('detailedInfo');
            detailedInfo.innerHTML = '';
            if (data.username) {
                  var p2 = document.createElement('p');
                  p2.setAttribute('style','text-align:center');
                  var t2 = document.createTextNode(data.username);
                  p2.appendChild(t2);
                  detailedInfo.appendChild(p2);
            }
            if (data.email != undefined) {
                  var e = document.createElement('p');
                  e.setAttribute('style','text-align:center');
                  var t = document.createTextNode(data.email);
                  e.appendChild(t);
                  detailedInfo.appendChild(e);
            }
            var a = document.createElement('p');
            if (data.street != undefined) {      
                  var t = document.createTextNode(data.street + ', ');
                  a.appendChild(t);
                  detailedInfo.appendChild(a);
            }
            if (data.address != undefined) {
                  //var a = document.createElement('p');
                  var t = document.createTextNode(data.address);
                  a.appendChild(t);
                  detailedInfo.appendChild(a);
            }
            var hr = document.createElement('hr');
            detailedInfo.appendChild(hr);
            var manageUser = document.createElement('div');
            manageUser.setAttribute('id', 'manageUser');
            var switchUser = document.createElement('span');
            switchUser.setAttribute('id', 'switchUser');
            switchUser.setAttribute('style', 'color:blue; cursor:pointer; float:left;');
            var switchText = document.createTextNode('Switch User');
            switchUser.appendChild(switchText);
            manageUser.appendChild(switchUser);
            var updateUser = document.createElement('span');
            updateUser.setAttribute('id', 'updateUser');
            updateUser.setAttribute('style', 'color:blue; cursor:pointer; float:right;padding-left:20px;');
            var updateText = document.createTextNode('Update Profile');
            updateUser.appendChild(updateText);
            manageUser.appendChild(updateUser);
            detailedInfo.appendChild(manageUser);
            detailedInfo.style.display = 'block';
      }
      // Add an event listener on theLogin DIV to manage improved user experience while
      // entering credentials and/or address info. Functionally, display is used to assist in 
      // enforcing form validation and progress in filling personal data. For example, email &
      // address information are hidden until the username & password are entered and conform
      // to the validation rules. 
      var theLogin = document.getElementById('theLogin');
      theLogin.addEventListener('keyup', loginResults, false);
      var userInfo;
      var uname; 
      var upassword;
      function loginResults(evt) {
            if (evt.target.id == 'username') {
                  if(evt.target.value.length < 3) {
                        document.getElementById('unameHint').style.display = 'block';
                        document.getElementById('pwd1Hint').style.display = 'none';
                        document.getElementById('pwd2Hint').style.display = 'none';
                        // reset the password value for a better user experience
                        document.getElementById('pwd1').value = '';
                        document.getElementById('pwd2').value = '';
                  }
                  else  {
                        uname = evt.target.value;
                        // reset the password value for a better user experience
                        document.getElementById('pwd1').value = '';
                        document.getElementById('pwd2').value = '';
                        document.getElementById('unameHint').style.display = 'none';
                        document.getElementById('pwd1Hint').style.display = 'block';
                  }
            }
            if (evt.target.id == 'pwd1') {
                  if (document.getElementById('username').value.length < 3) {
                        document.getElementById('pwd1Hint').style.display = 'none';
                        document.getElementById('pwd2Hint').style.display = 'none';
                        // reset the password value for a better user experience
                        document.getElementById('pwd1').value = '';
                        document.getElementById('pwd2').value = '';
                        return;
                  }
                  if (evt.target.value.length < 8) {
                        document.getElementById('pwd1Hint').style.display = 'block';
                  }
                  else  {
                        // We are here because the username and pwd1 are accepted.
                        //1) First thing in the process of switch users clear the FilmTable for previous user
                        // cleanup any old rows. Keep the first row (table heading)
                        while (filmTable.firstChild.nextSibling.nextSibling) {
                              filmTable.removeChild(filmTable.firstChild.nextSibling.nextSibling);
                        }
                        // Hide Film Table containing Film Info for previous user
                        $('#output1').addClass('hidden');

                        upassword = evt.target.value;
                        var matchedUser = false, matchedPassword = false;
                        var tmpusr;
                        // 2) Verify whether this user already exist in the users list???
                        $(users).each(function(index){
                              if (this.username == uname) {
                                    matchedUser = true;
                                    tmpusr = this;
                                    // found a match on username, now check the password
                                    if (this.password == upassword) {
                                          // returning user validated
                                          matchedPassword = true;
                                    }
                              }
                        });
                        if (matchedUser == false) {
                              // No Match found: this is a new user: proceed in validating the passwd: make pwd2 visible
                              document.getElementById('confirming').style.display = 'block';
                              document.getElementById('pwd1Hint').style.display = 'none';
                              document.getElementById('pwd2').style.display = 'block';
                              document.getElementById('pwd2Hint').style.display = 'block';
                              filmCollection = [];//reset and remove collection of previous user
                        }
                        else if (matchedUser == true && matchedPassword == false) {
                              // we found the username but the Password does not match what is saved
                              document.getElementById('pwd1Hint1').style.display = 'block';
                        }
                        else if (matchedUser == true && matchedPassword == true) {
                              // All is good user found with matching password. Proceed to 
                              // Populating the FilmTable from the localStorage and reset the input form
                              userInfo = new UserLoginInfo(tmpusr.username,tmpusr.password,
                                                                              tmpusr.street, tmpusr.address,tmpusr.email,false);
                              document.getElementById('pwd1Hint1').style.display = 'none';
                              document.getElementById('theLogin').style.display = 'none';
                              document.getElementById('aboutYou').style.display = 'none';
                              
                              document.getElementById('aboutme').style.display = 'block';
                              document.getElementById('confirming').style.display = 'none';
                              document.getElementById('pwd2Hint').style.display = 'none';

                              document.getElementById('aboutme').innerHTML = uname;
                              document.getElementById("theForm").reset();
                              // retrieve saved collection of this user from previous login
                              filmCollection = retrieveFilmInfo(uname);
                              if (filmCollection.length > 0) {
                                    var film;
                                    $(filmCollection).each(function(index){
                                          film = filmCollection[index];
                                          filmTable.appendChild(displayFilm(film, index));
                                    });
                                    //filmTable.addEventListener('click', displayBio, false);
                                    //filmTable.addEventListener('click', getOverview, false);
                                    $('#output1').removeClass('hidden');
                              }
                              else {
                                    // Film Table is empty: no need to just show the headings
                                    $('#output1').addClass('hidden');
                              }
                        }
                  }
            }
            if (evt.target.id == 'pwd2') {
                  //We are here because the user was not found in the user table and so
                  // we proceed with password validation and the rest email/adress
                  if (document.getElementById('username').value.length < 3) {
                        //cover the case where the user starts modifying the username
                        //while pwd2 field is visible. 
                        document.getElementById('pwd1Hint').style.display = 'none';
                        document.getElementById('pwd2Hint').style.display = 'none';
                        // reset the password value for a better user experience
                        document.getElementById('pwd1').value = '';
                        document.getElementById('pwd2').value = '';
                        return;
                  }
                  if (evt.target.value.length < 8) {
                        // show hint for pwd2 while length does not meet min length req.
                        document.getElementById('pwd2Hint').style.display = 'block';
                  }
                  else if (evt.target.value === document.getElementById('pwd1').value) {
                        // The 2 passwords match. We can proceed to the next level: email and Address
                        document.getElementById('theLogin').style.display = 'none';
                        document.getElementById('aboutYou').style.display = 'block';
                        // Show the username at top right hand corner 
                        document.getElementById('aboutme').innerHTML = uname;
                        document.getElementById('aboutme').style.display = 'block';
                        userInfo = new UserLoginInfo(uname, evt.target.value);
                        // set the flag to true to know to push this to users table
                        userInfo.newUser = true; 
                        document.getElementById('confirming').style.display = 'none';
                        document.getElementById('pwd2Hint').style.display = 'none';
                        document.getElementById("theForm").reset();
                  }
            }
      }
      $('#email').change(function(){
            var email = document.getElementById('email');  //since only one entry in array
            email.setAttribute('pattern','\.+@\.+\\.[a-z]{2,3}$');
            if (email.value && email.validity.valid) {
                  userInfo.email = this.value;
            }
            else {
                  alert('Please Enter a valid email address:)');
            }
      });
      $('#address').change(function(){
            userInfo.street = this.value;
            if (this.value) {
                 $('#saveProfile').addClass('hidden');
            }
            else {
                  $('#saveProfile').removeClass('hidden');
            }
      });
      // Get the complete address info from google using the postal code
      $('#zip').change(function(){
            userInfo.address = undefined;
            $.getJSON("http://maps.googleapis.com/maps/api/geocode/json?address="+ this.value +"&sensor=false", 
              function(data){
                  if (data.Response == 'False') {
                        alert('Please Try again. Google Geo Api did not return valid data for ' + this.value + ' with Return Error: ' + data.Error);
                        return;
                  }
                  if (data.results.length > 0) {
                        userInfo.address = data.results[0].formatted_address;
                        $('#saveProfile').removeClass('hidden');
                  }
                  else {
                        alert('Invalid ZIP code: ' + this.value + '. No Results found!');
                        return;
                  }
            });
      });
      $('#saveProfile').click(function(){
            if (!$('#zip').val() && $('#address').val()) { 
                  alert ('Please Enter required ZIP/postal code since you entered a street value!');
                  return;
            }
            // This is just a precaution because save button will be hidden until the JSON Data is returned
            if (!userInfo.address && $('#zip').val()) {
                  alert('Save cannot proceed since Google Geo Code API has returned yet. Please Try Again!');
                  return;
            }
            // push new users only
            if (userInfo.newUser == true) {
                users.push(userInfo);
                window.localStorage.setItem(localStoreUsers, JSON.stringify(users));
                userInfo.newUser = false;
            }
            else {
                  // update the user's email and address in the localStorage to cover the case where the user
                  // had updated one or all these fields
                  $(users).each(function(index){
                        if (this.username == userInfo.username) {
                              this.email = userInfo.email;
                              this.street = userInfo.street;
                              this.address = userInfo.address;
                              return;
                        }
                  });
                  
                  window.localStorage.setItem(localStoreUsers, JSON.stringify(users));
            }
            
            document.getElementById('aboutYou').style.display = 'none';
            document.getElementById('address').innerHTML = '';
            document.getElementById('zip').innerHTML = '';
            displayLogin(userInfo);
            document.getElementById("theForm").reset();
      });
      $('#aboutme').click(function() {
            // Show Personal Info: user name, email, address
            if (userInfo) { 
                  if ($('#detailedInfo').children().length > 0 && $($('#detailedInfo').children()[0]).text() === userInfo.username) {
                        $('#detailedInfo').toggle();
                  }
                  else {
                        // username mismatch: go back to login window
                        displayLogin(userInfo);
                  }
            }
            
      });
      // Event handler to allow for either changing users or updating the profile of the current user
      $('#detailedInfo').click(function(evt){
            if (evt.target.id == 'switchUser') {
                  document.getElementById('detailedInfo').style.display = 'none';
                  document.getElementById('aboutYou').style.display = 'none';
                  document.getElementById('theLogin').style.display = 'block';
            }
            else if (evt.target.id == 'updateUser') {
                  document.getElementById('detailedInfo').style.display = 'none';
                  document.getElementById('aboutYou').style.display = 'block';
                  document.getElementById('theLogin').style.display = 'none';
                  //updateUser = true;
            }
      });
      // Setup Film Table Event Listeners: Should be setup once for entire Film Table.
      var filmTable = document.getElementById('filmTable');
      //This event will display individual BIO of clicked Actor/Director table row entry
      filmTable.addEventListener('click', displayBio, false);
      filmTable.addEventListener('click', getOverview, false);
      // Helper messages that will show up to guide the first time user
      filmTable.addEventListener('mouseover', displayHelpMsg, false);
      filmTable.addEventListener('mouseout', clearHelpMsg, false);
 
      function displayHelpMsg(evt) {
            var imDBid = $(evt.target).attr('class');
            if (evt.target.tagName == 'TR' && imDBid) {
                  $('#helper').removeClass('hidden');
            } else if (evt.target.tagName == 'TD' && imDBid) {
                  $('#helper1').removeClass('hidden');
            }
      }
      function clearHelpMsg(evt) {
            $('#helper').addClass('hidden');
            $('#helper1').addClass('hidden');
      }
      //constructor function for Actor/Director info <name and IMDB id assigned to person
      function ActorInfoEntry(name,id) {
            this.name = name;
            this.imDBid = id;
      }
      // constructor function for film info. args: title being the film title and 
      // id being the imDB id assigned internally by imDB.com
      function FilmInfoEntry(title, id) {
            this.film = title;
            this.imDBid = id;
            this.actorsList = new Array;
            this.director = new Array;
            this.year;
            this.genre = new Array;
            this.poster;
      }
      // the second arg (id) is the index into the collection array for future access to filmInfo
      // It will be stored as the ID of the filmRow for easy access thru DOM manipulation
      // DOM Manipulation: Dynamically building the Film Table rows based on returned data from IMDB API
      function displayFilm(data, id) {
   
            var filmRow = document.createElement('tr');
            filmRow.setAttribute('id', id);
            var filmtd = document.createElement('td');
            filmtd.setAttribute('class',data.imDBid);
            filmtd.setAttribute('style', 'color:red; cursor:pointer;');
            var film = document.createTextNode(data.film);
            filmtd.appendChild(film);
            filmRow.appendChild(filmtd);
            var directortd = document.createElement('td');
            $(data.director).each(function(index){
                  var directortr = document.createElement('tr');
                  if (this.imDBid) {
                        directortr.setAttribute('class', this.imDBid);//convenient way to get to imDBid when clicking on 
                        directortr.setAttribute('style', 'color:blue; cursor:pointer;');
                  }
                  
                  var director = document.createTextNode(this.name);
                  directortr.appendChild(director);
                  directortd.appendChild(directortr);
            });
            filmRow.appendChild(directortd);
            var actortd = document.createElement('td');
            $(data.actorsList).each(function(index){
                  var actortr = document.createElement('tr');
                  if (this.imDBid) {
                        actortr.setAttribute('class', this.imDBid);
                        actortr.setAttribute('style', 'color:blue; cursor:pointer;');
                  }
                  
                  var actor = document.createTextNode(this.name);
                  actortr.appendChild(actor);
                  actortd.appendChild(actortr);
            });
            filmRow.appendChild(actortd);
            var genretd = document.createElement('td');
            // In the cases where more than 1 Genre is provided...
            $(data.genre).each(function(index){
                  var genretr = document.createElement('tr');
                  var genre = document.createTextNode(this);
                  genretr.appendChild(genre);
                  genretd.appendChild(genretr);
            });
            filmRow.appendChild(genretd);

            var yeartd = document.createElement('td');
            var year = document.createTextNode(data.year);
            yeartd.appendChild(year);
            filmRow.appendChild(yeartd);

            //console.log(filmRow);
            return filmRow;
      }
      //This is where the fun and discovery starts: user enter a film title and imdbapi returns
      // the names, date and poster we are interested in
      $('#film').change(function(){
            var film = this.value;
            $('#output').addClass('hidden');
            $.getJSON("http://www.imdbapi.com/?t="+ this.value +"&sensor=false", function(data){
                  if (data.Response == 'False' || data.imdbID == undefined) {
                        alert('No IMDB API data for this title: ' + film + ' with Return Error: ' + data.Error);
                        return;
                  }
                  if (data.Title.toLowerCase() != film.toLowerCase()) {
                        alert ('Not a perfect match. Requested Film Title: \" ' + film + ' \". Film Found: \" ' + data.Title + ' \". Bailing out!');
                        return false;
                  }
                  
                  movieInfo = new FilmInfoEntry(data.Title,data.imdbID);
                  
                  if (data.Actors && data.Actors != 'N/A') {
                        var actors = data.Actors.split(', ');
                        $(actors).each(function(index){
                              movieInfo.actorsList[index] = new ActorInfoEntry(this);
                              getIMDBId(movieInfo, this);
                        });
                  }
                  if (data.Director && data.Director != 'N/A') {
                        var directors = data.Director.split(', ');
                        $(directors).each(function(i){
                              movieInfo.director[i] = new ActorInfoEntry(this);
                              getIMDBId(movieInfo, this);
                        });
                        //}
                  }
                  movieInfo.year = data.Year;
                  if (data.Genre) {
                        var genre = data.Genre.split(', ');
                        $(genre).each(function(i){
                              movieInfo.genre[i] = genre[i];
                        });
                  }
                  if (data.Poster != 'N/A') {
                        movieInfo.poster = data.Poster;
                        $('body').css('backgroundImage', 'url('+movieInfo.poster+')');
                  }
            });
      });
      function updateId(movieInfo, name, id) {
            //alert('title: ' + movieInfo.film + ' // lastname: ' + lastname + ' // IMDBId: ' + id);
            $(movieInfo.actorsList).each(function(i){
                  if (this.name == name) {
                        this.imDBid = id;
                  }
            });
            $(movieInfo.director).each(function(i){
                  if (this.name == name) {
                        this.imDBid = id;
                  }
            });
      }
      function getIMDBId(movieInfo, name) {
            //var fullname = firstname+'+'+lastname;
            re = new RegExp(' ', 'g');
            var fullname = name.replace(re, '+');
            var baseUrl = "http://www.imdb.com/xml/find?json=1&nr=1&nm=on&q="+
                                    fullname;
            var imdbId;
            $.ajax({
                  url: baseUrl,
                  type: "get",
                  dataType: "",
                  success: function(data) {
                        //console.log('Data returned from IMDB: ' + data);
                        //console.log(data);
                        if (data.responseText.length == 0 || data.responseText == 'False') {
                              alert ("No Data was returned for this Film, Please try again!");
                              return false;
                        }
                        var d = $(data.responseText)[0].data;
                        var collection = JSON.parse(d);
                        //console.log(collection['name_exact']);
                        var actor = name;
                        // get rid of special char from film name - a french movies problem
                        var abbr = movieInfo.film.replace('\'', ' ').split(' ');
                        var re = new RegExp(abbr[abbr.length-1], 'i');
                        $(collection['name_exact']).each(function(index){
                              var desc = this.description;
                              var found = desc.match(re);
                              if (found && this.name == actor) {
                                    imdbId = $(collection['name_exact'])[0].id;
                                    return;
                              }
                        });
                        if (!imdbId && collection['name_popular']) {
                            $(collection['name_popular']).each(function(index){
                                 var desc = this.description;
                                 var found = true;//desc.match(re);
                                 if (found && this.name == actor) {
                                      imdbId = this.id;
                                      return;
                                  }
                            });
                        }
                        if (!imdbId) {
                              $(collection['name_exact']).each(function(index){
                                    if (this.name == actor) {
                                          imdbId = $(collection['name_exact'])[0].id;
                                    }
                              });
                        }
                        if (!imdbId && collection['name_approx']) {
                              $(collection['name_approx']).each(function(index){
                                    var desc = this.description;
                                    var found = desc.match(re);
                                    if (found && this.name == actor) {
                                          imdbId = $(collection['name_approx'])[0].id;
                                          return;
                                    }
                              });
                        }
                        if (imdbId) {
                              updateId(movieInfo, name, imdbId);
                        }
                  }
            });         
      }
      //This $('#bio').click() event handlers Uses Closure to advance to next bio of Directors
      // And Actors (Fulfilling Requirement #3). This click event also fulfills requirement #2
      // for capturing and handling events. Logic highlight: start with collecting and display
      // Bio for the Director(s) and then Do the Actor(s). In some cases, the Director is also
      // an Actor in the movie and for simplicity her Bio will be displayed under both roles.
      $('#bio').click((function() { 
            //alert('SIF'); // this alert is used to demonstrate self invoking nature :
            // index is
            var index = 0; 
            return function() {
                  if (!movieInfo) {
                        alert('No Bio to Display!');
                        return false;
                  }
                  //var index1=filmCollection.length-1; // most recently added film info
                  var info = movieInfo;
                  var curIndex = index;
                  var directorLen = (info.director) ? info.director.length : 0;
                  var actorLen = (info.actorsList) ? info.actorsList.length : 0;
                  $('#output').addClass('hidden');//hide output
                  if (curIndex < directorLen) { // Get Director BIO
                           $('#output').html('');
                           getBio(info.director[curIndex].imDBid);
                  }
                  else if (info.actorsList) { // Do the actors next
                        $('#output').html('');
                        curIndex -= directorLen;
                        getBio(info.actorsList[curIndex].imDBid);
                  }
                  index++;
                  if (index == (actorLen+directorLen)) {
                        //alert('Current index = ' + index + 'resetting index! ... length = ' + (actorLen+directorLen));
                        index = 0;
                  }
            }
      }) ());

      $('#bio').hover(function(){
            $('#nextBiohelper').removeClass('hidden');
      },function(){
            $('#nextBiohelper').addClass('hidden');
      });

      $('#clearbio').click(function(evt) {
            $('#output').html('');
            $('body').css('backgroundImage', 'url('+'images/Collector.jpg'+')');
            $('#output').addClass('hidden');
            if ($('#filmTable').children().length > 1) {
                  $('#output1').removeClass('hidden');
            }
            else {
                  $('#output1').addClass('hidden');
            }
      });
      $('#output').click(function() {
            $('#output').html('');
            $('#output').addClass('hidden');
            $('body').css('backgroundImage', 'url('+'images/Collector.jpg'+')');
            if ($('#filmTable').children().length > 1) {
                  $('#output1').removeClass('hidden');
            }
      });
      $('#saveInfo').click(function(evt) {
            if (!movieInfo) {
                  alert('Nothing to Save!');
                  return false;
            }
            if (!(userInfo && userInfo.username)) {
                  alert('Please sign in or register to save your movie collection!');
                  return;
            }
            $('#output').addClass('hidden');
            $('#output1').removeClass('hidden');
            var foundIt = false;
            //make sure not to save the same film more than once
            $(filmCollection).each(function(index){
                  if (this.film == movieInfo.film) {
                        foundIt = true;
                  }
            });
            if ( foundIt == false) {
                  filmCollection.push(movieInfo);
                  //var filmTable = document.getElementById('filmTable');
                  filmTable.appendChild(displayFilm(movieInfo, filmCollection.length-1));
                  //This event will display individual BIO of clicked Actor/Director table row entry
                  //filmTable.addEventListener('click', displayBio, false);
                  //filmTable.addEventListener('click', getOverview, false);
            }
            // clear the image background here... no strong reason, just to keep it simple.
            $('body').css('backgroundImage', 'url('+'images/Collector.jpg'+')');
            document.getElementById("theForm").reset();
            window.localStorage.setItem("filmCollection-" + userInfo.username, JSON.stringify(filmCollection));
            
      });
      function displayBio(evt) {
            var imDBid = $(evt.target).attr('class');

            if (evt.target.tagName == 'TR' && imDBid) {
                  var tr = evt.target.parentNode.parentNode;
                  var filmInfo = filmCollection[$(tr).attr('id')];
                  $('body').css('backgroundImage', 'url('+filmInfo.poster+')');
                  $('#output').html('');
                  getBio(imDBid);
            }
      }

      function getOverview(evt) {
            //console.log(evt);
            var film = $(evt.target).attr('class');
            
            if (evt.target.tagName == 'TD' && film) {                  
                  var url = 'http://www.imdb.com/title/'+film;
                  console.log(url);
                  var content1;
                  $.ajax({
                  url: url,
                  type: 'get',
                  dataType: '',
                  success: function(data) {
                        $('#output').removeClass('hidden');
                        $('#output1').addClass('hidden');
                        var c = $(data.responseText);
                        content1 = $(c).find('table#title-overview-widget-layout');
                        
                        if (content1) {
                              var tr = evt.target.parentNode;
                              var filmInfo = filmCollection[$(tr).attr('id')];
                             
                              $('body').css('backgroundImage', 'url('+filmInfo.poster+')');
                              var a = $(content1).find('a');
                              //console.log(a);
                              a.each(function(){
                                      this.href = '#'; //disable the link to to go to imdb. want to stay on here
                              });
                              
                              $(content1).find('div.star-box.giga-star').addClass('hidden');
                              $(content1).find('td#overview-bottom').addClass('hidden');
                              $('#output').html(content1);
                        }
                        else {
                              alert('film overview not found!');
                              $('#output').addClass('hidden');
                              $('#output1').removeClass('hidden');
                        }

                  }
            });      
         }
      }
      //$('#filmTable').click(function() {});
      function getBio(imdbId) {
            // check if ID is undefined... return
            if (imdbId == undefined) {
                  return;
            }
            var baseUrl = 'http://www.imdb.com/name/' + imdbId + '/?ref_=nv_sr_1'; 
            
            var content1;
            $.ajax({
                  url: baseUrl,
                  type: 'get',
                  dataType: '',
                  success: function(data) {
                        //console.log(data);
                        $('#output').removeClass('hidden');
                        $('#output1').addClass('hidden');
                        var c = $(data.responseText);
                        content1 = $(c).find('div#name-overview-widget');
                        var a = $(content1).find('a');
                        //console.log(a);
                        a.each(function(){
                                this.href = '#'; //disable the link to to go to imdb. want to stay on here
                        });
                        $('#output').append(content1);
                  }
            });
      }
      // Documentation help:
      $('#helpme').click(function(){
            $('#container').toggle();
            $('#projectInfo').toggle();
      });
      $('#projectInfo').click(function(){
            $('#container').toggle();
            $('#projectInfo').toggle();
      });
}) ;