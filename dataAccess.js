let mysql = require('mysql');
const util = require('util');
const _ = require('lodash');


let connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'productmanager'
});
connection.connect(function(err) {
  if (err) {
    return console.error('error: ' + err.message);
  }

  console.log('Connected to the MySQL server.');
});
const query = util.promisify(connection.query).bind(connection);

// Users

const getUsers = async () => {
  return await query('SELECT * FROM users');
};

const verifyUser = async (username) => {
  return await query('SELECT count(*) as count_users FROM users WHERE username=? ', [username]);
};

// Projects

const getProjects = async (username) => {
  return await query('SELECT * FROM projects WHERE username=?', [username]);
};

const createProject = async (name) => {
  return await query('INSERT INTO projects (name) VALUES (?)', [name]);
};

const updateProject = async ({id, name}) => {
  return await query('UPDATE projects SET name = ? WHERE id = ?', [name, id]);
};

const getProject = async (id) => {
  const results = await query('SELECT * FROM projects WHERE id = ?', [id]);
  return results[0];
};

const deleteProject = async (id) => {
  return await query('DELETE FROM projects WHERE id = ?', [id]);
};

const getProjectFiles = async (projectId) => {
  return await query('SELECT * FROM project_files WHERE project_id = ?', [projectId]);
};

const addProjectFile = async ({name, projectId}) => {
  return await query('INSERT INTO project_files (name, project_id) VALUES (?, ?)', [name, projectId]);
};

// Requirements

const getProjectRequirements = async (projectId) => {
  return await query('SELECT * FROM project_requirements WHERE project_id = ?', [projectId]);
};

const updateRequirement = async (reqId, content) => {
  await query('UPDATE project_requirements SET content = ? WHERE id = ?', [content, reqId]);
  return query('SELECT * FROM project_requirements WHERE id = ?', [reqId])
};

const deleteRequirement = async (id) => {
  await query('DELETE FROM reqs_to_tasks WHERE req_id = ?', [id]);
  return await query('DELETE FROM project_requirements WHERE id = ?', [id]);
};

// Tasks

const getProjectTasks = async (projectId) => {
  return await query('SELECT * FROM project_tasks WHERE project_id = ?', [projectId]);
};

const getTask = async (taskId) => {
  return await query('SELECT * FROM project_tasks WHERE id = ?', [taskId]);
};

const getTaskRequirements = async (taskId) => {
  return await query('SELECT * FROM project_requirements pr JOIN reqs_to_tasks rtt ON pr.id = rtt.req_id WHERE rtt.task_id = ?', [taskId]);
};

const updateTask = async ({taskId, parentTaskId, content}) => {
  if (parentTaskId) {
    await query('UPDATE project_tasks SET parent_task_id = ? WHERE id = ?', [parentTaskId, taskId]);
  } else {
    await query('UPDATE project_tasks SET content = ? WHERE id = ?', [content, taskId]);
  }

  return query('SELECT * FROM project_tasks WHERE id = ?', [taskId])
};

const createReqToTask = async (taskId, reqId) => {
  return await query('INSERT INTO reqs_to_tasks (task_id, req_id) VALUES (?, ?)', [taskId, reqId]);
};

const createTask = async (content, reqs, projectId, parentTaskId) => {
  const data = await query('INSERT INTO project_tasks (content, project_id, parent_task_id) VALUES (?, ?, ?)', [content, projectId, parentTaskId]);
  const newId = await query('SELECT max(id) as id FROM project_tasks');
  reqs.map(reqId => createReqToTask(newId[0].id, reqId));
};

const deleteTask = async (taskId) => {
  let newTasksToDelete = await query('SELECT * FROM project_tasks WHERE parent_task_id = ?', [taskId]);
  let newTaskIdsToDelete = _.map(newTasksToDelete, 'id');
  let taskIdsToDelete = [taskId, ...newTaskIdsToDelete];
  let deleteSize = 0;
  while (_.size(taskIdsToDelete) !== deleteSize) {
    newTasksToDelete = await query('SELECT * FROM project_tasks WHERE parent_task_id IN (?)', [taskIdsToDelete]);
    newTaskIdsToDelete = _.map(newTasksToDelete, 'id');
    taskIdsToDelete = [...taskIdsToDelete, ...newTaskIdsToDelete];
    deleteSize = _.size(taskIdsToDelete);
  }
  console.log('delete!', taskIdsToDelete);

  await query('DELETE FROM reqs_to_tasks WHERE task_id IN (?)', [taskIdsToDelete]);
  await query('DELETE FROM project_tasks WHERE id IN (?)', [taskIdsToDelete]);

};

const getTasksRequirements = async (taskIds) => {
  return await query('SELECT * FROM project_requirements pr JOIN reqs_to_tasks rtt ON pr.id = rtt.req_id WHERE rtt.task_id IN (?)', [taskIds]);
};

module.exports = {
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
  getTask,
  updateTask,
  createTask,
  createReqToTask,
  deleteTask,
  getTaskRequirements,
  getTasksRequirements
};
