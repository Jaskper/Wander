var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    Yelp = require('yelp'),
    defer = require('node-defer'),
    Q = require('q');
    
var yelp = new Yelp({
  consumer_key: 'Q9GMm1BQzImdjJrYgoekuA',
  consumer_secret: 'yVoY9r5jT8VY7fzTjPd3Fndvp1o',
  token: 'YvFc1UZlgJeFLr6YKvBfZOCCfSbLvM5k',
  token_secret: 'MgV6boGgUl6p-8hV86b1spqE_Yw',
});

var users = [];
var currentID = -1;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/pages/index.html');
});
/*
app.get('/survey', function(req, res){
  res.sendFile(__dirname + '/pages/survey.html');
});
*/
app.get('/users', function(req, res){
  res.sendFile(__dirname + '/pages/users.html');
});

app.get('/login', function(req, res){
  res.sendFile(__dirname + '/pages/login.html');
});
/*
app.get('/test', function(req, res){
  console.log('request incoming');
  //console.log(req);
  //console.log('params: ' + req.params.username);
  console.log('username: ' + req.query.username);
  console.log('password: ' + req.query.password);
  
  var attemptedUsername = req.query.username;
  var attemptedPassword = req.query.password;
  
  var found = false;
  for(var i=0; i<users.length; i++){
    if(users[i].username == attemptedUsername && users[i].password == attemptedPassword){
      //res.send(JSON.stringify({result: 'success'}));
      res.send("success");
      found = true;
    }
  }
  if(!found){
    //res.send(JSON.stringify({result: 'failure'}));
    res.send('failure');
  }
});

app.get('/data', function(req, res){
  
  var requestingUser = req.query.username;
  //var requestingLati = req.query.lati;
  //var requestingLongi = req.qeury.longi;
  
  var requestingLati = 39.952584;
  var requestingLongi = -75.165222;
  
  console.log('something happened: ' + requestingUser);
  
  for(var i=0; i<users.length; i++){
    if(users[i].username == requestingUser){
      
      var longString = "";
      
      createSuggestionFinalCoordinate(users[i], requestingLati, requestingLongi).then(function(data){
        for(var j=0; j<data.length; j++){
          var currentBusiness = data[j].business;
          var currentMatch = data[j].match;
          var currentType = data[j].type;
          
          var categoriesString = "";
          for(var k=0; k<currentBusiness.categories.length; k++){
            categoriesString += currentBusiness.categories[k][0] + ", ";
          }
          
          var addString = "" + currentBusiness.name + "¡" + currentBusiness.rating + "¡" + currentBusiness.location.address + "¡" + currentMatch + "¡" + currentBusiness.url + "¡" + currentType + "¡" + currentBusiness.image_url + "¡" + categoriesString + "¡";
          longString += addString;
          
        }
        res.send(longString);
      });
    }
  }
  
});
*/
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function selectiveAddFood(array, element){
  var newArray = array;
  var existing = false;
  
  for(var i=0; i<newArray.length; i++){
    if(newArray[i].type == element){
      newArray[i].rating++;
      existing = true;
    }
  }
  if(!existing){
    newArray.push({type: element, rating: 1});
  }
  return newArray;
} //searches array for element; if element is found, rating is incremented; else creates a new element with rating 1

function findShopSuggestions(user, number){
  var shopPreferances = user.shop;
  var results = [];
  var preferances = [];
  var finalSuggestions = [];
  
  var userCategoriesString = "";
  for(var i=0; i<shopPreferances.length; i++){
    userCategoriesString += shopPreferances[i].type;
    userCategoriesString += ",";
  }
  userCategoriesString = userCategoriesString.substring(0, userCategoriesString.length - 1);
  
  yelp.search({category_filter: userCategoriesString, location: user.city, limit: 20, sort: 0})
    .then(function(yelpData1){
      
      results.push.apply(results, yelpData1.businesses);
      
        yelp.search({category_filter: userCategoriesString, location: user.city, limit: 20, offset: 20, sort: 0})
          .then(function(yelpData){
            
            results.push.apply(results, yelpData.businesses);
            
            for(var i=0; i<results.length; i++){ //iterates through all potential businesses
              var categories = results[i].categories;
              var totalPoints = 0;
              
              for(var j=0; j<categories.length; j++){ //iterates through all the categories of each business
                
                for(var k=0; k<shopPreferances.length; k++){ //iterates through all the user's shop preferances
                  if(categories[j][1] == shopPreferances[k].type){
                    totalPoints += shopPreferances[k].rating;
                  }
                  if(k == (shopPreferances.length - 1) && j==(categories.length-1)){
                    var score = Math.log2(0.0 + totalPoints) * (results[i].rating + 2);
                    if(score > 0){
                      preferances.push({business: results[i], match: score, type: 'Shop'});
                    }
                  }
                }
                
              }
              if(i == (results.length - 1)){
                for(var currentSuggestion=0; currentSuggestion<number; currentSuggestion++){
                  
                  var highIndex = -1;
                  var currentHighest;
                  
                  for(var m=0; m<preferances.length; m++){
                    if(m==0 || preferances[m].match > currentHighest.match){
                      currentHighest = preferances[m];
                      highIndex = m;
                    }
                  }
                  
                  //if(highIndex > -1){
                    finalSuggestions.push(currentHighest);
                    preferances.splice(highIndex, 1);
                  //}
                }
                
                this.resolve(finalSuggestions);
                return finalSuggestions;
              }
            }
            
          });
    });
} //deprecated

function findFoodSuggestions(user, number){
  var foodPreferances = user.food;
  var results = [];
  var preferances = [];
  var finalSuggestions = [];
  
  var userCategoriesString = "";
  for(var i=0; i<foodPreferances.length; i++){
    userCategoriesString += foodPreferances[i].type;
    userCategoriesString += ","
  }
  userCategoriesString = userCategoriesString.substring(0, userCategoriesString.length - 1);
  
  yelp.search({category_filter: userCategoriesString, location: user.city, limit: 20, sort: 0})
    .then(function(yelpData1){
      
      results.push.apply(results, yelpData1.businesses);
      
      
        yelp.search({category_filter: userCategoriesString, location: user.city, limit: 20, offset: 20, sort: 0})
          .then(function(yelpData){
            
            results.push.apply(results, yelpData.businesses);
            
            for(var i=0; i<results.length; i++){ //iterates through all potential businesses
              var categories = results[i].categories;
              var totalPoints = 0;
              
              for(var j=0; j<categories.length; j++){ //iterates through all the categories of each business
                
                for(var k=0; k<foodPreferances.length; k++){ //iterates through all the user's food preferances
                  if(categories[j][1] == foodPreferances[k].type){
                    totalPoints += foodPreferances[k].rating;
                  }
                  if(k == (foodPreferances.length - 1) && j==(categories.length-1)){
                    var score = Math.log2(0.0 + totalPoints) * (results[i].rating + 2);
                    if(score > 0){
                      preferances.push({business: results[i], match: score, type: 'Food'});
                    }
                  }
                }
                
              }
              if(i == (results.length - 1)){
                
                for(var currentSuggestion=0; currentSuggestion<number; currentSuggestion++){
                  
                  var highIndex = -1;
                  var currentHighest;
                  
                  for(var m=0; m<preferances.length; m++){
                    if(m==0 || preferances[m].match > currentHighest.match){
                      currentHighest = preferances[m];
                      highIndex = m;
                    }
                  }
                  
                  if(highIndex > -1){
                    finalSuggestions.push(currentHighest);
                    preferances.splice(highIndex, 1);
                  }
                }
                this.resolve(finalSuggestions);
                return finalSuggestions;
              }
            }
            
          });
    });
  
  
  
} //deprecated

function findSupplementalActivites(user, number){
  var active = user.active,
      beauty = user.beauty,
      night = user.night,
      arts = user.arts;
      
  var possibleActivities = [];
  var finalActivities = [];
  
  yelp.search({category_filter: 'active', location: user.city, limit: 5, sort: 0})
    .then(function(yelpDataActive){
      var activeBusinesses = yelpDataActive.businesses;
      for(var i=0; i<activeBusinesses.length; i++){
        var scoreActive = (activeBusinesses[i].rating + 1.0) * Math.log2(0.0 + active);
        possibleActivities.push({business: activeBusinesses[i], match: scoreActive, type: 'Active Activites'});
      }
      
      yelp.search({category_filter: 'beautysvc', location: user.city, limit: 5, sort: 0})
        .then(function(yelpDataBeauty){
          var beautyBusinesses = yelpDataBeauty.businesses;
          for(var j=0; j<beautyBusinesses.length; j++){
            var scoreBeauty = (beautyBusinesses[j].rating + 1.0) * Math.log2(0.0 + beauty);
            possibleActivities.push({business: beautyBusinesses[j], match: scoreBeauty, type: 'Beauty Activites'});
          }
          
          yelp.search({category_filter: 'nightlife', location: user.city, limit: 5, sort: 0})
            .then(function(yelpDataNight){
              var nightBusinesses = yelpDataNight.businesses;
              for(var k=0; k<nightBusinesses.length; k++){
                var scoreNight = (nightBusinesses[k].rating + 1.0) * Math.log2(0.0 + night);
                possibleActivities.push({business: nightBusinesses[k], match: scoreNight, type: 'Night Activities'});
              }
              
              yelp.search({category_filter: 'arts', location: user.city, limit: 5, sort: 0})
                .then(function(yelpDataArts){
                  var artsBusinesses = yelpDataArts.businesses;
                  for(var l=0; l<artsBusinesses.length; l++){
                    var scoreArts = (artsBusinesses[l].rating + 1.0) * Math.log2(0.0 + arts);
                    possibleActivities.push({business: artsBusinesses[l], match: scoreArts, type: 'Arts Activities'});
                  }
                  
                  
                  for(var currentActivity=0; currentActivity<number; currentActivity++){
                    
                    var highest;
                    var highestIndex;
                    
                    for(var currentSearch=0; currentSearch<possibleActivities.length; currentSearch++){
                      if(currentSearch == 0 || possibleActivities[currentSearch].match > highest.match){
                        highest = possibleActivities[currentSearch];
                        highestIndex = currentSearch;
                      }
                    }
                    
                    finalActivities.push(highest);
                    possibleActivities.splice(highestIndex, 1);
                    
                  }
                  
                  var shuffledActivites = shuffleArray(finalActivities);
                  this.resolve(shuffledActivites);
                  return shuffledActivites;
                  
                  
                });
            });
          
        });
      
    });
} //deprecated

function findLocalSuggestions(user){
  yelp.search({category_filter: "localflavor,landmarks", location: user.city, limit: 1, sort: 2})
    .then(function(yelpData){
      var tempObject = {business: yelpData.businesses[0], match: 100, type: 'Local'};
      this.resolve(tempObject);
    });
} //deprecated

function createSuggestionFinal(user){
  var supplementActivities = 0;
  var distribution = [0,0,1,0];
  var finalSuggestions = [];
  var catsDone = 0;
  
  var deferred = Q.defer();
  
  if(user.active > 5){
    supplementActivities++;
  }
  if(user.night > 5){
    supplementActivities++;
  }
  if(user.arts > 5){
    supplementActivities++;
  }
  if(user.beauty > 5){
    supplementActivities++;
  }
  
  if(supplementActivities == 4){
    distribution[3] = 4;
    distribution[0] = 3;
    distribution[1] = 2;
  }else if(supplementActivities == 3){
    distribution[3] = 3;
    distribution[0] = 4;
    distribution[1] = 2;
  }else{
    distribution[3] = 2;
    distribution[0] = 4;
    distribution[1] = 3;
  }
  
  
  var foodSuggestions = defer(findFoodSuggestions(user, distribution[0]));
  foodSuggestions.then(function(data){
    //finalSuggestions.push.apply(finalSuggestions, data);
    finalSuggestions = finalSuggestions.concat(data);
    console.log("after food: " + finalSuggestions.length);
    
    var shopSuggestions = defer(findShopSuggestions(user, distribution[1]));
    shopSuggestions.then(function(data1){
      //finalSuggestions.push.apply(finalSuggestions, data1);
      finalSuggestions = finalSuggestions.concat(data1);
      console.log("after shop: " + finalSuggestions.length);
      
      var localSuggestion = defer(findLocalSuggestions(user));
      localSuggestion.then(function(data2){
        finalSuggestions.push(data2);
        console.log("after local: " + finalSuggestions.length);
        
          var activitesSuggestion = defer(findSupplementalActivites(user, distribution[3]));
          activitesSuggestion.then(function(data3){
            finalSuggestions = finalSuggestions.concat(data3);
            console.log("after activites: " + finalSuggestions.length);
            
            console.log('resolved');
            //var shuffledSuggestions = shuffleArray(finalSuggestions);
            deferred.resolve(finalSuggestions);
          });
        
        
      });
      
    });
    
  });
  
  return deferred.promise;
  //var shopSuggestions = findShopSuggestions(user, distribution[1]);
  /*
  setTimeout(function(){
    console.log(foodSuggestions.length);
    finalSuggestions.push.apply(finalSuggestions, foodSuggestions);
    finalSuggestions.push.apply(finalSuggestions, shopSuggestions);
    console.log(finalSuggestions.length);
    return finalSuggestions;
  }, 5000);
  */
  
  /*
  var foodPreferances = defer(findFoodSuggestions(user, distribution[0]));
  foodPreferances.then(function(data){
    
    finalSuggestions.push.apply(finalSuggestions, data.business);
      
    var shopPreferances = defer(findShopSuggestions(user, distribution[1]));
    shopPreferances.then(function(data){
      finalSuggestions.push.apply(finalSuggestions, data.business);
      //createSuggestionFinal.resolve();
    });
      
  });
  /*
/*
  
  var localSuggestion = defer(findLocalSuggestions(user));
  localSuggestion.then(function(data){
    finalSuggestions.push.apply(finalSuggestions, data);
    catsDone++;
    console.log('cats done ' + catsDone);
    if(catsDone == 3){
      console.log("ayy: " + finalSuggestions.length);
      this.resolve(finalSuggestions);
      return finalSuggestions;
    }
  });
  */
} //deprecated

function createSuggestionFinalCoordinate(user, latitude, longitude){
  var supplementActivities = 0;
  var distribution = [0,0,1,0];
  var finalSuggestions = [];
  var catsDone = 0;
  
  var deferred = Q.defer();
  
  if(user.active > 5){
    supplementActivities++;
  }
  if(user.night > 5){
    supplementActivities++;
  }
  if(user.arts > 5){
    supplementActivities++;
  }
  if(user.beauty > 5){
    supplementActivities++;
  }
  
  if(supplementActivities == 4){
    distribution[3] = 4;
    distribution[0] = 3;
    distribution[1] = 2;
  }else if(supplementActivities == 3){
    distribution[3] = 3;
    distribution[0] = 4;
    distribution[1] = 2;
  }else{
    distribution[3] = 2;
    distribution[0] = 4;
    distribution[1] = 3;
  }
  
  
  var foodSuggestions = defer(findFoodSuggestionsCoordinate(user, distribution[0], latitude, longitude));
  foodSuggestions.then(function(data){
    //finalSuggestions.push.apply(finalSuggestions, data);
    finalSuggestions = finalSuggestions.concat(data);
    console.log("after food: " + finalSuggestions.length);
    
    var shopSuggestions = defer(findShopSuggestionsCoordinate(user, distribution[1], latitude, longitude));
    shopSuggestions.then(function(data1){
      //finalSuggestions.push.apply(finalSuggestions, data1);
      finalSuggestions = finalSuggestions.concat(data1);
      console.log("after shop: " + finalSuggestions.length);
      
      var localSuggestion = defer(findLocalSuggestionsCoordinate(user, latitude, longitude));
      localSuggestion.then(function(data2){
        finalSuggestions.push(data2);
        console.log("after local: " + finalSuggestions.length);
        
          var activitesSuggestion = defer(findSupplementalActivitesCoordinate(user, distribution[3], latitude, longitude));
          activitesSuggestion.then(function(data3){
            finalSuggestions = finalSuggestions.concat(data3);
            console.log("after activites: " + finalSuggestions.length);
            
            console.log('resolved');
            //var shuffledSuggestions = shuffleArray(finalSuggestions);
            deferred.resolve(finalSuggestions);
          });
        
        
      });
      
    });
    
  });
  
  return deferred.promise;
}

function findShopSuggestionsCoordinate(user, number, latitude, longitude){
  var shopPreferances = user.shop;
  var results = [];
  var preferances = [];
  var finalSuggestions = [];
  
  
  var coordinateString = "" + latitude + "," + longitude;
  
  var userCategoriesString = "";
  for(var i=0; i<shopPreferances.length; i++){
    userCategoriesString += shopPreferances[i].type;
    userCategoriesString += ",";
  }
  userCategoriesString = userCategoriesString.substring(0, userCategoriesString.length - 1);
  
  yelp.search({category_filter: userCategoriesString, ll: coordinateString, limit: 20, sort: 0})
    .then(function(yelpData1){
      
      results.push.apply(results, yelpData1.businesses);
      
        yelp.search({category_filter: userCategoriesString, ll: coordinateString, limit: 20, offset: 20, sort: 0})
          .then(function(yelpData){
            
            results.push.apply(results, yelpData.businesses);
            
            for(var i=0; i<results.length; i++){ //iterates through all potential businesses
              var categories = results[i].categories;
              var totalPoints = 0;
              
              for(var j=0; j<categories.length; j++){ //iterates through all the categories of each business
                
                for(var k=0; k<shopPreferances.length; k++){ //iterates through all the user's shop preferances
                  if(categories[j][1] == shopPreferances[k].type){
                    totalPoints += shopPreferances[k].rating;
                  }
                  if(k == (shopPreferances.length - 1) && j==(categories.length-1)){
                    var score = Math.log2(0.0 + totalPoints) * (results[i].rating + 2);
                    if(score > 0){
                      preferances.push({business: results[i], match: score, type: 'Shop'});
                    }
                  }
                }
                
              }
              if(i == (results.length - 1)){
                for(var currentSuggestion=0; currentSuggestion<number; currentSuggestion++){
                  
                  var highIndex = -1;
                  var currentHighest;
                  
                  for(var m=0; m<preferances.length; m++){
                    if(m==0 || preferances[m].match > currentHighest.match){
                      currentHighest = preferances[m];
                      highIndex = m;
                    }
                  }
                  
                  //if(highIndex > -1){
                    finalSuggestions.push(currentHighest);
                    preferances.splice(highIndex, 1);
                  //}
                }
                
                this.resolve(finalSuggestions);
                return finalSuggestions;
              }
            }
            
          });
    });
}

function findFoodSuggestionsCoordinate(user, number, latitude, longitude){
  var foodPreferances = user.food;
  var results = [];
  var preferances = [];
  var finalSuggestions = [];
  
  var matches = [];
  
  var coordinateString = "" + latitude + "," + longitude;
  
  var userCategoriesString = "";
  for(var i=0; i<foodPreferances.length; i++){
    userCategoriesString += foodPreferances[i].type;
    userCategoriesString += ","
  }
  userCategoriesString = userCategoriesString.substring(0, userCategoriesString.length - 1);
  
  yelp.search({category_filter: userCategoriesString, ll: coordinateString, limit: 20, sort: 0})
    .then(function(yelpData1){
      
      results.push.apply(results, yelpData1.businesses);
      
      
        yelp.search({category_filter: userCategoriesString, ll: coordinateString, limit: 20, offset: 20, sort: 0})
          .then(function(yelpData){
            
            results.push.apply(results, yelpData.businesses);
            
            for(var i=0; i<results.length; i++){ //iterates through all potential businesses
              var categories = results[i].categories;
              var totalPoints = 0;
              
              for(var j=0; j<categories.length; j++){ //iterates through all the categories of each business
                
                for(var k=0; k<foodPreferances.length; k++){ //iterates through all the user's food preferances
                  if(categories[j][1] == foodPreferances[k].type){
                    totalPoints += foodPreferances[k].rating;
                  }
                  if(k == (foodPreferances.length - 1) && j==(categories.length-1)){
                    var score = Math.log2(0.0 + totalPoints) * (results[i].rating + 2);
                    if(score > 0){
                      preferances.push({business: results[i], match: score, type: 'Food'});
                    }
                  }
                }
                
              }
              if(i == (results.length - 1)){
                
                for(var currentSuggestion=0; currentSuggestion<number; currentSuggestion++){
                  
                  var highIndex = -1;
                  var currentHighest;
                  
                  for(var m=0; m<preferances.length; m++){
                    if(m==0 || preferances[m].match > currentHighest.match){
                      currentHighest = preferances[m];
                      highIndex = m;
                    }
                  }
                  
                  if(highIndex > -1){
                    finalSuggestions.push(currentHighest);
                    preferances.splice(highIndex, 1);
                  }
                }
                this.resolve(finalSuggestions);
                return finalSuggestions;
              }
            }
            
          });
    });
}

function findLocalSuggestionsCoordinate(user, latitude, longitude){
  var coordinateString = "" + latitude + "," + longitude;
  yelp.search({category_filter: "localflavor,landmarks", ll: coordinateString, limit: 1, sort: 2})
    .then(function(yelpData){
      var tempObject = {business: yelpData.businesses[0], match: 100, type: 'Local'};
      this.resolve(tempObject);
    });
}

function findSupplementalActivitesCoordinate(user, number, latitude, longitude){
  var active = user.active,
      beauty = user.beauty,
      night = user.night,
      arts = user.arts;
      
  var possibleActivities = [];
  var finalActivities = [];
  
  var coordinateString = "" + latitude + "," + longitude;
  
  yelp.search({category_filter: 'active', ll: coordinateString, limit: 5, sort: 0})
    .then(function(yelpDataActive){
      var activeBusinesses = yelpDataActive.businesses;
      for(var i=0; i<activeBusinesses.length; i++){
        var scoreActive = (activeBusinesses[i].rating + 1.0) * Math.log2(0.0 + active);
        possibleActivities.push({business: activeBusinesses[i], match: scoreActive, type: 'Active Activites'});
      }
      
      yelp.search({category_filter: 'beautysvc', ll: coordinateString, limit: 5, sort: 0})
        .then(function(yelpDataBeauty){
          var beautyBusinesses = yelpDataBeauty.businesses;
          for(var j=0; j<beautyBusinesses.length; j++){
            var scoreBeauty = (beautyBusinesses[j].rating + 1.0) * Math.log2(0.0 + beauty);
            possibleActivities.push({business: beautyBusinesses[j], match: scoreBeauty, type: 'Beauty Activites'});
          }
          
          yelp.search({category_filter: 'nightlife', ll: coordinateString, limit: 5, sort: 0})
            .then(function(yelpDataNight){
              var nightBusinesses = yelpDataNight.businesses;
              for(var k=0; k<nightBusinesses.length; k++){
                var scoreNight = (nightBusinesses[k].rating + 1.0) * Math.log2(0.0 + night);
                possibleActivities.push({business: nightBusinesses[k], match: scoreNight, type: 'Night Activities'});
              }
              
              yelp.search({category_filter: 'arts', ll: coordinateString, limit: 5, sort: 0})
                .then(function(yelpDataArts){
                  var artsBusinesses = yelpDataArts.businesses;
                  for(var l=0; l<artsBusinesses.length; l++){
                    var scoreArts = (artsBusinesses[l].rating + 1.0) * Math.log2(0.0 + arts);
                    possibleActivities.push({business: artsBusinesses[l], match: scoreArts, type: 'Arts Activities'});
                  }
                  
                  
                  for(var currentActivity=0; currentActivity<number; currentActivity++){
                    
                    var highest;
                    var highestIndex;
                    
                    for(var currentSearch=0; currentSearch<possibleActivities.length; currentSearch++){
                      if(currentSearch == 0 || possibleActivities[currentSearch].match > highest.match){
                        highest = possibleActivities[currentSearch];
                        highestIndex = currentSearch;
                      }
                    }
                    
                    finalActivities.push(highest);
                    possibleActivities.splice(highestIndex, 1);
                    
                  }
                  
                  var shuffledActivites = shuffleArray(finalActivities);
                  this.resolve(shuffledActivites);
                  return shuffledActivites;
                  
                  
                });
            });
          
        });
      
    });
  
  
  
}

function adjustFoodUserPreferances(user, category, increase){
  var found = false
  for(var i=0; i<users.length; i++){
    var userFoodPreferances = user.food;
    for(var j=0; j<userFoodPreferances.length; j++){
      if(userFoodPreferances[j].type == category){
        found = true;
        if(increase){
          user.food[j].rating++;
        }else{
          if(userFoodPreferances[j].rating != 1){
            user.food[j].rating--;
          }else{
            user.food.splice(j, 1);
          }
        }
      }
    }
  }
  if(!found && increase){
    user.food.push({type: category, rating: 1});
  }
}

function adjustShopUserPreferance(user, category, increase){
  var found = false
  for(var i=0; i<users.length; i++){
    var userShopPreferances = user.shop;
    for(var j=0; j<userShopPreferances.length; j++){
      if(userShopPreferances[j].type == category){
        found = true;
        if(increase){
          user.shop[j].rating++;
        }else{
          if(userShopPreferances[j].rating != 1){
            user.shop[j].rating--;
          }else{
            user.shop.splice(j, 1);
          }
        }
      }
    }
  }
  if(!found && increase){
    user.shop.push({type: category, rating: 1});
  }
}

function adjustActivitesUserPreferance(user, category, increase){
  //0: active, 1: beauty, 2: night, 3: arts
  
  if(category == 0){
    if(increase){
      if(user.active < 10){
        user.active++;
      }
    }else{
      if(user.active > 0){
        user.active--;
      }
    }
  }
  
  if(category == 1){
    if(increase){
      if(user.beauty < 10){
        user.beauty++;
      }
    }else{
      if(user.beauty > 0){
        user.beauty--;
      }
    }
  }
  
  if(category == 2){
    if(increase){
      if(user.night < 10){
        user.night++;
      }
    }else{
      if(user.night > 0){
        user.beauty--;
      }
    }
  }
  
  if(category == 3){
    if(increase){
      if(user.arts < 10){
        user.arts++;
      }
    }else{
      if(user.arts > 0){
        user.arts++;
      }
    }
  }
  
}

function createSuggestionsGroup(listOfUsers, latitude, longitude){
  
  var groupUser = new Object();
  groupUser.food = [];
  groupUser.shop = [];
  
  var activeTotal = 0;
  var beautyTotal = 0;
  var nightTotal = 0;
  var artsTotal = 0;
  
  var deferred = Q.defer();
  
  for(var i=0; i<listOfUsers.length; i++){
    
    var currentUserFood = listOfUsers[i].food;
    var currentUserShop = listOfUsers[i].shop;
    
    activeTotal += listOfUsers[i].active;
    beautyTotal += listOfUsers[i].beauty;
    nightTotal += listOfUsers[i].night;
    artsTotal += listOfUsers[i].arts;
    
    for(var j=0; j<currentUserFood.length; j++){ //iterates through all the food categories the user likes
      
      var currentCategory = currentUserFood[j].type;
      var currentRating = currentUserFood[j].rating;
      
      var found = false;
      
      for(var k=0; k<groupUser.food.length; k++){ //iterates through all the group 
        
        if(groupUser.food[k].type == currentCategory){
          
          found = true;
          groupUser.food[k].rating += currentRating; 
          
        }
      }
      
      if(found == false){
        groupUser.food.push({type: currentCategory, rating: currentRating});
      }
      
    }
    
    for(var j=0; j<currentUserShop.length; j++){ //iterates through all the food categories the user likes
      
      var currentCategory = currentUserShop[j].type;
      var currentRating = currentUserShop[j].rating;
      
      var found = false;
      
      for(var k=0; k<groupUser.shop.length; k++){ //iterates through all the group 
        
        
        if(groupUser.shop[k].type == currentCategory){
          found = true;
          groupUser.shop[k].rating += currentCategory;
          
        }
          
        
      }
      
      if(!found){
        groupUser.shop.push({type: currentCategory, rating: currentRating});
      }
      
    }
    
    
  }
    var activeAverage = (0.0 + activeTotal) / (listOfUsers.length);
    var beautyAverage = (0.0 + beautyTotal) / (listOfUsers.length);
    var nightAverage = (0.0 + nightTotal) / (listOfUsers.length);
    var artsAverage = (0.0 + artsTotal) / (listOfUsers.length);
    
    groupUser.active = activeAverage;
    groupUser.beauty = beautyAverage;
    groupUser.night = nightAverage;
    groupUser.arts = artsAverage;
    
    createSuggestionFinalCoordinate(groupUser, latitude, longitude).then(function(data){
      deferred.resolve(data);
    });
    
    return deferred.promise;
    
  
}

io.on('connection', function(socket){
  console.log("connection");
  
  socket.on('get_data', function(request){
    yelp.search({term: request[0], location: request[1], limit: 10})
    .then(function(data){
      var businesses = data.businesses;
      socket.emit('new_data', businesses);
    });
  });
  
  socket.on('new_phase2', function(userData){
    var city = userData.city,
        foodPlaces = userData.food,
        shopPlaces = userData.shop;
    
    var categoriesArray = [];
    for(var i=0; i<foodPlaces.length; i++){
      yelp.search({term: foodPlaces[i], location: city, limit: 1})
        .then(function(yelpData){
          var foodCategories = yelpData.businesses[0].categories;
          for(var j=0; j<foodCategories.length; j++){
            categoriesArray = selectiveAddFood(categoriesArray, foodCategories[j][1]);
          }
          
        });
    }
    
    
    /*
    for(var i=0; i<shopPlaces.length; i++){
      yelp.search({term: shopPlaces[i], location: city, limit: 1})
        .then(function(yelpData){
          console.log(yelpData.businesses[0].categories);
        });
    }
    */
  });
  
  socket.on('get_phase3', function(city){
    
    var activeSuggestions = [],
        beautySuggestions = [],
        nightSuggestions = [],
        artsSuggestions = [];
    
    var searchesDone = 0;
    
      yelp.search({category_filter: 'active', location: city, limit: 3, sort: 2})
        .then(function(yelpData){
          var results = yelpData.businesses;
          for(var i=0; i<results.length; i++){
            activeSuggestions.push({name: results[i].name, url: results[i].url, type: 'active'});
          }
          searchesDone++;
          if(searchesDone == 4){
            socket.emit('phase3_suggestions', {active: activeSuggestions, beauty: beautySuggestions, night: nightSuggestions, arts: artsSuggestions});
          }
        });
      yelp.search({category_filter: 'beautysvc', location: city, limit: 3, sort: 2})
        .then(function(yelpData){
          var results = yelpData.businesses;
          for(var i=0; i<results.length; i++){
            beautySuggestions.push({name: results[i].name, url: results[i].url, type: 'beauty'});
          }
          searchesDone++;
          if(searchesDone == 4){
            socket.emit('phase3_suggestions', {active: activeSuggestions, beauty: beautySuggestions, night: nightSuggestions, arts: artsSuggestions});
          }
        });
      yelp.search({category_filter: 'nightlife', location: city, limit: 3, sort:2})
        .then(function(yelpData){
          var results = yelpData.businesses;
          for(var i=0; i<results.length; i++){
            nightSuggestions.push({name: results[i].name, url: results[i].url, type: 'night'});
          }
          searchesDone++;
          if(searchesDone == 4){
            socket.emit('phase3_suggestions', {active: activeSuggestions, beauty: beautySuggestions, night: nightSuggestions, arts: artsSuggestions});
          }
        });
      yelp.search({category_filter: 'arts', location: city, limit: 3, sort:2})
        .then(function(yelpData){
          var results = yelpData.businesses;
          for(var i=0; i<results.length; i++){
            artsSuggestions.push({name: results[i].name, url: results[i].url, type: 'arts'});
          }
          searchesDone++;
          if(searchesDone == 4){
            socket.emit('phase3_suggestions', {active: activeSuggestions, beauty: beautySuggestions, night: nightSuggestions, arts: artsSuggestions});
          }
        });
    
  });
  
  socket.on('survey_complete', function(data){
    var newUser = new Object();
    
    var current = 0;
    currentID++;
    
    var city = data.city,
        foodPlaces = data.food,
        shopPlaces = data.shop;
    
    newUser.username = data.username;
    newUser.password = data.password;
    newUser.id = currentID;
    newUser.city = city;
    newUser.active = data.active;
    newUser.beauty = data.beauty;
    newUser.arts = data.arts;
    newUser.night = data.night;
    
    var other = false;
    
    var categoriesArray = [];
    for(var i=0; i<foodPlaces.length; i++){
      yelp.search({category_filter: 'food,restaurants', term: foodPlaces[i], location: city, limit: 1})
        .then(function(yelpData){
          if(yelpData.total > 0){
            var foodCategories = yelpData.businesses[0].categories;
            for(var k=0; k<foodCategories.length; k++){
              categoriesArray = selectiveAddFood(categoriesArray, foodCategories[k][1]);
            }
            newUser.food = categoriesArray;
          }
          current++;
          if(current == 10){
            users.push(newUser);
          }
        });
    }
    
    var shopCategoriesArray = [];
    for(var l=0; l<shopPlaces.length; l++){
      yelp.search({category_filter: 'shopping', term: shopPlaces[l], location: city, limit: 1})
        .then(function(yelpData){
          if(yelpData.total > 0){
            var shopCategories = yelpData.businesses[0].categories;
            for(var j=0; j<shopCategories.length; j++){
              shopCategoriesArray = selectiveAddFood(shopCategoriesArray, shopCategories[j][1]);
            }
            
            newUser.shop = shopCategoriesArray;
          }
          current++;
          if(current == 10){
            users.push(newUser);
            console.log(JSON.stringify(newUser));
            socket.emit('characterisic_sending', JSON.string(newUser));
          }
        });
    }
  });
  
  socket.on('request_users', function(){
    var jsonUsers = JSON.stringify(users);
    socket.emit('deliver_users', jsonUsers);
  });
  
  socket.on('check_credentials', function(data){
    var attemptedUsername = data.user;
    var attemptedPassword = data.pass;

    var used = false;
    
    for(var i=0; i<users.length; i++){
      if(attemptedUsername == users[i].username){
        used = true;
      }
    }
    
    if(!used){
      socket.emit('credentials_confirmed', {user: attemptedUsername, pass: attemptedPassword});
    }else{
      socket.emit('credentials_denied');
    }
    
  });
  
  socket.on('attempted_login', function(data){
    var username = data.username;
    var password = data.password;
    
    console.log(username + ' ' + password);
    var success = false;
    
    for(var i=0; i<users.length; i++){
      if(users[i].username == username && users[i].password == password){
        success = true;
        console.log('success');
        socket.emit('login_success', username);
      }
    }
    
    if(!success){
      console.log('faill');
      socket.emit('login_failure');
    }
  });
    
  socket.on('get_suggestions', function(username){
    for(var i=0; i<users.length; i++){
      if(users[i].username == username){
        createSuggestionFinalCoordinate(users[i], 39.952584, -75.165222).then(function(data){
          socket.emit('send_suggestions', data);
        });
      }
    }
  });
  
  socket.on('get_suggestions_coordinate', function(data){
    for(var i=0; i<users.length; i++){
      if(users[i].username == data.user){
        createSuggestionFinalCoordinate(users[i], data.lati, data.longi).then(function(data1){
          socket.emit('send_suggestions', data1);
        });
      }
    }
  });
    
  socket.on('together_attempt', function(inputUsers){
    
    var confirmed = true;
    
    for(var i=0; i<inputUsers.length; i++){
      
      var currentUser = inputUsers[i];
      var found = false;
      
      for(var j=0; j<users.length; j++){
        
        if(currentUser == users[j].username);
        found = true;
        
      }
      
      if(found == false){
        confirmed = false;
      }
    }  
    
    if(!confirmed){
      socket.emit('group_error');
    }else{
      
      var usersArray = [];
      
      for(var i=0; i<inputUsers.length; i++){
        for(var j=0; j<users.length; j++){
          if(users[j].username == inputUsers[i]){
            usersArray.push(users[j]);
          }
        }
      }
      
      createSuggestionsGroup(usersArray, 39.952584, -75.165222).then(function(data){
        socket.emit('send_suggestions', data);
      });
      
    }
    
  });
  
  socket.on('test', function(){
    
    createSuggestionsGroup(users, 39.952584, -75.165222).then(function(data){
      for(var i=0; i<data.length; i++){
        console.log(data[i].business.name);
      }
    });
    
  });
});


app.use(express.static(__dirname + '/public'));

http.listen(process.env.PORT, process.env.IP);