fetch("http://localhost:3000/api/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "test@example.com", password: "test" })
}).then(res => res.text()).then(console.log);
