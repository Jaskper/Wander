var socket = io.connect();
var city = "";
var foodPlaces = [];
var shopPlaces = [];
var username = "";
var password = "";


var currentSuggestion = 0;
var suggestions = [];

var activeLikes = 0,
    beautyLikes = 0,
    nightLikes = 0,
    artsLikes = 0;

window.addEventListener('load',function(){
    
    document.getElementById('phase0_submit').addEventListener("click", function(){
       var attemptedUsername = document.getElementById('username_input').value;
       var attemptedPassword = document.getElementById('password_input').value;
       
       if(attemptedPassword != "" && attemptedUsername != ""){
            socket.emit('check_credentials', {user: attemptedUsername, pass: attemptedPassword});
       }else{
            alert('Please fill in both fields');
       }
    });
    
    document.getElementById("phase1_submit").addEventListener("click", function(){
        var city_attempt = document.getElementById("city_input").value;
        if(city_attempt.length > 0){
           city = city_attempt;
           document.getElementById('phase1').style.display = 'none';
           document.getElementById('phase2').style.display = 'inline';
        }else{
           alert("Please input a city.");
        }
        
    });
    
    document.getElementById("phase2_submit").addEventListener("click", function(){
       var filled = true;
       
       for(var i=1; i<6; i++){
           var food_attempt = document.getElementById('food'+ i).value;
           if(food_attempt.length > 0){
               foodPlaces[i-1] = food_attempt;
           }else{
               filled = false;
           }
           
           var shop_attempt = document.getElementById('shop'+i).value;
           if(shop_attempt.length > 0){
               shopPlaces[i-1] = shop_attempt;
           }else{
               filled = false;
           }
       } 
       
       if(!filled){
           alert('Please fill in all fields.');
           foodPlaces.length = 0;
           shopPlaces.length = 0;
       }else{
           socket.emit('get_phase3', city);
       }
    });
    
    document.getElementById("phase3_yes").addEventListener("click", function(){
        var likedCategory = suggestions[currentSuggestion].type;
        
        if(likedCategory == 'active'){
            activeLikes += 3;
        }
        if(likedCategory == 'beauty'){
            beautyLikes += 3;
        }
        if(likedCategory == 'night'){
            nightLikes += 3;
        }
        if(likedCategory == 'arts'){
            artsLikes += 3;
        }
        
        currentSuggestion++;
        
        if(currentSuggestion == 12){
            socket.emit('survey_complete', {username: username, password: password, food: foodPlaces, shop: shopPlaces, active: activeLikes, beauty: beautyLikes, night: nightLikes, arts: artsLikes, city: city});
            document.getElementById('phase3').style.display = 'none';
            document.getElementById('phase4').style.display = 'inline';
        }else{
            document.getElementById('location_suggestion_name').innerHTML = "<a target=\"_blank\" href=\"" + suggestions[currentSuggestion].url + "\">" + suggestions[currentSuggestion].name + "</a>";
            //document.getElementById('location_suggestion_url').innerHTML = suggestions[currentSuggestion].url;
        }
    });
    
    document.getElementById("phase3_no").addEventListener("click", function(){
        currentSuggestion++;
        if(currentSuggestion == 12){
            socket.emit('survey_complete', {username: username, password: password, food: foodPlaces, shop: shopPlaces, active: activeLikes, beauty: beautyLikes, night: nightLikes, arts: artsLikes, city: city});
            document.getElementById('phase3').style.display = 'none';
            document.getElementById('phase4').style.display = 'inline';
        }else{
            document.getElementById('location_suggestion_name').innerHTML = "<a target=\"_blank\" href=\"" + suggestions[currentSuggestion].url + "\">" + suggestions[currentSuggestion].name + "</a>";
            //document.getElementById('location_suggestion_url').innerHTML = suggestions[currentSuggestion].url;
        }
    });
    
    socket.on('phase3_suggestions', function(data){
        var activeSuggestions = data.active;
        var beautySuggestions = data.beauty;
        var nightSuggestions = data.night;
        var artsSuggestions = data.arts;
        
        
        document.getElementById('phase2').style.display = 'none';
        document.getElementById('phase3').style.display = 'inline';
        
        for(var i=0; i<3; i++){
            for(var j=0; j<4; j++){
                if(j==0){
                    suggestions.push(activeSuggestions[i]);
                }
                if(j==1){
                    suggestions.push(beautySuggestions[i]);
                }
                if(j==2){
                    suggestions.push(nightSuggestions[i]);
                }
                if(j==3){
                    suggestions.push(artsSuggestions[i]);
                }
            }
        } //places all the suggestions in specific order in one array
        
        document.getElementById('location_suggestion_name').innerHTML = "<a href=\"" + suggestions[0].url + "\">" + suggestions[0].name + "</a>";
        //document.getElementById('location_suggestion_url').innerHTML = suggestions[0].url;
        
        
        
    });
    
    socket.on('credentials_confirmed', function(data){
        
        var attemptedUsername = data.user;
        var attemptedPassword = data.pass;
        username = attemptedUsername;
        password = attemptedPassword;
        
        document.getElementById('phase0').style.display = 'none';
        document.getElementById('phase1').style.display = 'inline';
    });
    
    socket.on('characterisic_sending', function(user){
        //alert('hhh');
        document.getElementById('characterization').innerHTML = user;
    });
    
    socket.on('credentials_denied', function(){
       document.getElementById('username_input').innerHTML = "";
       document.getElementById('password_input').innerHTML = "";
       
       alert('That username is already in use.');
    });
    
});