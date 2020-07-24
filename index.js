const express = require('express');
const cors = require('cors');
const multer = require('multer');
const _ = require('lodash');
const bodyParser = require('body-parser');
const { projects, projectRequirements, projectFiles, projectTasks, taskToRequirements } = require('./dataAccess');

const app = express();
const port = 3010;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/files')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});
const upload = multer({ storage }).single('file');

app.get('/projects', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.json(projects);
});

app.post('/projects', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    projects.push({
       id: (_.get(_.maxBy(projects, 'id'), 'id')  || 0) + 1,
       name: req.body.name
    });
    res.json(projects);
});

app.put('/projects/:id', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    _.remove(projects, ({id}) => _.toString(id) === req.params.id);
    projects.push(req.body);
    res.json(req.body);
});

app.delete('/projects/:id', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    _.remove(projects, ({id}) => _.toString(id) === req.params.id);
    res.send('ok');
});

app.get('/projects/:id', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.json(_.find(projects, ({id}) => _.toString(id) === req.params.id));
});

app.get('/projectFiles/:id', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const files = _.filter(projectFiles, ({projectId}) => _.toString(projectId) === req.params.id);
  res.json(files || []);
});

app.post('/projectFiles/:id', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
    }

    projectFiles.push({
      id: (_.get(_.maxBy(projectFiles, 'id'), 'id')  || 0) + 1,
      name: req.file.originalname,
      projectId: req.params.id
    });
    return res.status(200).send(req.file);
  });
});

app.get('/projectRequirements/:id', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const requirements = _.filter(projectRequirements, ({projectId}) => _.toString(projectId) === req.params.id);
  res.json(requirements || []);
});

app.put('/projectRequirements/:id', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const requirement = _.find(projectRequirements, ({id}) => _.toString(id) === req.params.id);
  requirement.content = req.body.updatedContent;
  res.json(requirement);
});

app.delete('/projectRequirement/:id', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  _.remove(projectRequirements, ({id}) => _.toString(id) === req.params.id);
  res.send('ok');
});


app.get('/projectTasks/:id', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const tasks = _.filter(projectTasks, ({projectId}) => _.toString(projectId) === req.params.id);
  const requirements = _.filter(projectRequirements, ({projectId}) => _.toString(projectId) === req.params.id);
  const tasksWithRequirements = _.map(
    tasks,
    (task) => ({
      ...task,
      requirements: _.filter(requirements, ({id}) => _.map(_.filter(taskToRequirements, ({taskId}) => taskId === task.id), 'reqId').includes(id))
    })
  );
  res.json(tasksWithRequirements || []);
});

app.put('/projectTasks/:id', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const task = _.find(projectTasks, ({id}) => _.toString(id) === req.params.id);
  if (req.body.parentTaskId) {
    task.parentTaskId = req.body.parentTaskId;
  }
  if (req.body.content) {
    task.content = req.body.content;
  }
  res.json(task);
});

app.post('/linkTaskToRequirement', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  taskToRequirements.push({
    taskId: req.body.taskId,
    reqId: req.body.reqId,
  });
  res.json('ok');
});

app.delete('/projectTasks/:id', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  let taskIdsToDelete = [req.params.id];
  let currentTaskIdsToDelete = _.filter(projectTasks, ({id, parentTaskId}) => req.params.id === parentTaskId);
  while (!_.isEmpty(currentTaskIdsToDelete)) {
    taskIdsToDelete = [...taskIdsToDelete, ...currentTaskIdsToDelete];
    currentTaskIdsToDelete = _.filter(projectTasks, ({id, parentTaskId}) => currentTaskIdsToDelete.includes(parentTaskId));
  }
  _.remove(projectTasks, ({id}) => taskIdsToDelete.includes(_.toString(id)));
  res.send('ok');
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
