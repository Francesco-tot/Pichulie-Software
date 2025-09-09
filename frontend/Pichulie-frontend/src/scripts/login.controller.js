
document.getElementById("login").addEventListener("click",async function () {

    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    try {
        
        let response = await fetch("http://localhost:8000/api/users/login/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              email: email,
              password: password
            })
          });
          
        if (!response.ok) {
            throw new Error("Error en la petición: " + response.status);
        }

        let data = await response.json()
      
        

    } catch (error) {
        
      }
    
})