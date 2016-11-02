

var socket = io.connect();

window.addEventListener('load',function(){
    
    document.getElementById("button").addEventListener("click", function(){
        socket.emit('test');
    });
    
    socket.on('new_data', function(businesses){
        var info_string = "";
       for(var i = 0; i < businesses.length; i++){
          info_string = info_string + "" + (i+1) + ".) " + businesses[i].name + " " + businesses[i].rating + "<br>";
        }
        document.getElementById("info").innerHTML = info_string
    });
    
    socket.on('submit_users', function(users){
        for(var i=0; i<users.length; i++){
            alert(users[i].id);
        }
    });

});