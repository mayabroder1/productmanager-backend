const express = require('express');
const cors = require('cors');
const multer = require('multer');
const _ = require('lodash');
const bodyParser = require('body-parser');


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

const projects = [{
  id: 1,
  name: 'project no. 1'
}];
const projectFiles = [];

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

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
