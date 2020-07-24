const projects = [{
  id: 1,
  name: 'project no. 1'
}];

const projectFiles = [];

const projectRequirements = [{
  id: '1',
  projectId: '1',
  sourceText: 'source text bla blba',
  content: 'req content'
}, {
  id: '2',
  projectId: '1',
  sourceText: 'source text 2 bla blba',
  content: 'req content 2'
}, {
  id: '3',
  projectId: '1',
  sourceText: 'source text 3 bla blba',
  content: 'req content 3'
}];

const taskToRequirements = [{
  taskId: '1',
  reqId: '1'
},{
  taskId: '2',
  reqId: '1'
},{
  taskId: '1',
  reqId: '2'
},{
  taskId: '3',
  reqId: '1'
}, ];

const projectTasks = [{
  id: '1',
  projectId: '1',
  parentTaskId: null,
  content: 'task 1',
  requirementId: '1'
}, {
  id: '2',
  projectId: '1',
  parentTaskId: '1',
  content: 'task 2',
  requirementId: '1'
}, {
  id: '3',
  projectId: '1',
  parentTaskId: '1',
  content: 'task 3',
  requirementId: '2'
}, {
  id: '4',
  projectId: '1',
  parentTaskId: '2',
  content: 'task 4',
  requirementId: '2'
}, {
  id: '5',
  projectId: '1',
  parentTaskId: null,
  content: 'task 5',
  requirementId: '2'
}];

module.exports = {
  projects,
  projectFiles,
  projectRequirements,
  projectTasks,
  taskToRequirements
};
