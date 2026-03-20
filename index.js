const express = require("express");
const app = express();
const cors = require("cors");

const { getTeams } = require("./routes/getteams.js");
const { getTasks } = require("./routes/gettasks.js");
const { postTaskslog } = require("./routes/posttaskslog.js");
const { postArrivallog } = require("./routes/postarrivallog.js");
const { checkpointCheck } = require("./routes/checkpointcheck.js");
const { postNewTeam } = require("./routes/postteam.js");

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send({ msg: "hello" });
});

app.get("/teams", (req, res) => {
    getTeams(req, res);
});

app.get("/tasks", (req, res) => {
    getTasks(req, res);
});

app.post("/taskslog", (req, res) => {
    postTaskslog(req, res);
});

app.post("/arrivallog", (req, res) => {
    postArrivallog(req, res);
});

app.post("/checkpoint", (req, res) => {
    checkpointCheck(req, res);
});

app.post("/newteam", (req, res) => {
    postNewTeam(req, res);
});

const PORT = process.env.BE_PORT || 3001;
app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});
