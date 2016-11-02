var socket = io.connect();

var suggestions = [];
var currentUser = "";

var clicked = false;

window.addEventListener('load',function(){
    document.getElementById('location_stuff').style.display = 'none';
    
    document.getElementById('login_button').addEventListener("click", function(){
        
       var username = document.getElementById('username_input').value;
       var password = document.getElementById('password_input').value;
       
       socket.emit('attempted_login', {username: username, password: password});
    });
    
    document.getElementById('wander_button').addEventListener("click", function(){
        if(!clicked){
            socket.emit('get_suggestions_coordinate', {user: currentUser, lati: 39.952584, longi: -75.165222}); 
        }
        clicked = true;
        setInterval(function(){
            clicked = false;
        },5000);
    });
   
    document.getElementById('group_submit').addEventListener("click", function(){
        var array = [];
        var temp = document.getElementById('friend_user').value;
        array.push(currentUser);
        array.push(temp);
        socket.emit('together_attempt', array);
    });
    
    document.getElementById('location_submit').addEventListener("click", function(){
        var inputLati = document.getElementById('latitude_input').value;
        var inputLongi = document.getElementById('longitude_input').value;
        
        alert('hhhh');
        
        socket.emit('get_suggestions_coordinate', {user: currentUser, lati: inputLati, longi: inputLongi});
    });
    
    document.getElementById('more_options').addEventListener("click", function(){
       document.getElementById('location_stuff').style.display = 'none';
       document.getElementById('options').style.display = 'inline';
    });
    
    document.getElementById('back_button').addEventListener("click", function(){
        document.getElementById('location_stuff').style.display = 'inline';
       document.getElementById('options').style.display = 'none';
    });
    
    document.getElementById('addition_submit').addEventListener("click", function(){
        var likedPlace = document.getElementById('addition_input').value;
        socket.emit('new_preferances',{user: currentUser, businessName: likedPlace});
    });
    
    socket.on('login_failure', function(){
        document.getElementById('username_input').innerHTML = "";
        document.getElementById('password_input').innerHTML = "";
        alert('That username/password combo was not found.'); 
    });
    
    socket.on('login_success', function(correctUser){
        currentUser = correctUser;
        
        document.getElementById("login_stuff").style.display = 'none';
        document.getElementById("location_stuff").style.display = 'inline';
        
        //socket.emit('get_suggestions', currentUser);
        
        /*
        document.getElementById('login_stuff').style.display = 'none';
        var print = "";
        for(var i=0; i<businesses.length; i++){
            print = print + (i+1) + ".) " + "<a href=\"" + businesses[i].business.url + "\">" + businesses[i].business.name + "</a>" + "<br>" + businesses[i].business.location.address + "<br>" + "Match to you: " + businesses[i].match + "<br>Main Category: " + businesses[i].type + "<br><br>";
            suggestions.push(businesses[i]);
        }
        document.getElementById('suggestions').innerHTML = print;
        */
    });
    
    socket.on('send_suggestions', function(businesses){
        document.getElementById('login_stuff').style.display = 'none';
        document.getElementById('location_stuff').style.display = 'none';
        document.getElementById('options').style.display = 'none';
        var print = "";
        for(var i=0; i<businesses.length; i++){
            print = print + (i+1) + ".) " + "<a target=\"_blank\"href=\"" + businesses[i].business.url + "\">" + businesses[i].business.name + "</a>" + "<br>" + businesses[i].business.location.address + "<br>" + "Match to you: " + businesses[i].match + "<br>Main Category: " + businesses[i].type + "<br><br>";
            suggestions.push(businesses[i]);
        }
        document.getElementById('suggestions').innerHTML = print;
    });
});