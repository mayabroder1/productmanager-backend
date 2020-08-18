const express = require('express');
const cors = require('cors');
const multer = require('multer');
const _ = require('lodash');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const basicAuth = require('express-basic-auth');
const {
  getUsers,
  verifyUser,
  getProjects,
  createProject,
  updateProject,
  getProject,
  deleteProject,
  getProjectFiles,
  addProjectFile,
  getProjectRequirements,
  updateRequirement,
  deleteRequirement,
  getProjectTasks,
  createReqToTask,
  updateTask,
  createTask,
  deleteTask,
  getTasksRequirements,
} = require('./dataAccess');
const {encrypt, decrypt, AUTH_TOKEN, AUTH_TOKEN_IV} = require('./authTools');

const app = express();
const port = 3010;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

app.use(cookieParser('82e4e438a0802faaf62f9854e3b575af'));

const storage = multer.diskStorage({
  destination: function async(req, file, cb) {
    cb(null, 'public/files')
  },
  filename: function async(req, file, cb) {
    cb(null, file.originalname)
  }
});
const upload = multer({storage}).single('file');

const authMiddleware = async (req, res, next) => {
  try {
    const authUser = decrypt({
      encryptedData: req.headers[AUTH_TOKEN], iv: req.headers[AUTH_TOKEN_IV]
    });
    const user = await verifyUser(authUser);
    if (user[0].count_users === 1) {
      next();
    } else {
      res.send('unauthorised');
    }
  } catch (err) {
    res.send('unauthorised');
  }
};

app.post('/auth', async (req, res) => {
  const users = await getUsers();
  let foundUser = false;
  users.forEach(({username, password}) => {
    if (username === req.body.username && password === req.body.password) {
      foundUser = encrypt(req.body.username);
    }
  });

  res.json({result: foundUser});
});

app.get('/verifyAuth', async (req, res) => {
  try {
    const authUser = decrypt({
      encryptedData: req.headers[AUTH_TOKEN], iv: req.headers[AUTH_TOKEN_IV]
    });
    const users = await getUsers();
    res.send(_.map(users, 'username').includes(authUser));
  } catch (err) {
    res.send('false');
  }
});

// Projects

app.get('/projects', authMiddleware, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const authUser = decrypt({
    encryptedData: req.headers[AUTH_TOKEN], iv: req.headers[AUTH_TOKEN_IV]
  });

  res.json(await getProjects(authUser));
});

app.post('/projects', authMiddleware, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  await createProject(req.body.name);
  res.json(await getProjects());
});

app.put('/projects/:id', authMiddleware, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  await updateProject(req.body);
  res.json(req.body);
});

app.delete('/projects/:id', authMiddleware, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  await deleteProject(req.params.id);
  res.send('ok');
});

app.get('/projects/:id', authMiddleware, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.json(await getProject(req.params.id));
});

// Files

app.get('/projectFiles/:id', authMiddleware, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.json(await getProjectFiles(req.params.id));
});

app.post('/projectFiles/:id', authMiddleware, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
    }

    await addProjectFile({
      name: req.file.originalname,
      projectId: req.params.id
    });

    return res.status(200).send(req.file);
  });
});

app.get('/projectRequirements/:id', authMiddleware, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.json(await getProjectRequirements(req.params.id));
});

app.put('/projectRequirements/:id', authMiddleware, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const requirement = await updateRequirement(req.params.id, req.body.updatedContent);
  res.json(requirement[0]);
});

app.delete('/projectRequirement/:id', authMiddleware, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  await deleteRequirement(req.params.id);
  res.send('ok');
});

// Tasks

app.get('/projectTasks/:id', authMiddleware, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const tasks = await getProjectTasks(req.params.id);
  const tasksObjects = _.map(tasks, task => Object.assign({}, task));
  const taskIds = _.map(tasks, 'id');

  const reqs = await getTasksRequirements(taskIds);
  const reqsObjects = _.map(
    reqs, ({
             content,
             req_id,
             task_id,
             source_text,
           }) => ({
      reqId: req_id,
      taskId: task_id,
      sourceText: source_text,
      content,
    })
  );

  const tasksWithRequirements = _.map(
    tasksObjects,
    ({id, parent_task_id, content}) => {
      let taskReqs = _.filter(reqsObjects, ({taskId}) => taskId === id);
      return ({
        id,
        parentTaskId: parent_task_id,
        content,
        requirements: taskReqs
      });
    });
  res.json(tasksWithRequirements);
});

app.put('/projectTasks/:id', authMiddleware, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const task = await updateTask({
    taskId: req.params.id,
    parentTaskId: req.body.parentTaskId,
    content: req.body.content,
  });
  res.json(task);
});

app.post('/projectTasks/:projectId', authMiddleware, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  console.log('debug', req.body);
  await createTask(req.body.content, req.body.requirements, req.params.projectId, req.body.parentTaskId);
  res.json('ok');
});

app.post('/linkTaskToRequirement', authMiddleware, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  await createReqToTask(req.body.taskId, req.body.reqId);
  res.json('ok');
});

app.delete('/projectTasks/:id', authMiddleware, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  await deleteTask(req.params.id);
  res.send('ok');
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
