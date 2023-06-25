const spawn = require("child_process").spawn;
const pythonProcess = spawn("python3", ["whatsapp.py"]);
pythonProcess.stdout.on("data", (data) => {
  mystr = data.toString();
  myjson = JSON.parse(mystr);
  console.log(`Json object is ${mystr}`);
});
