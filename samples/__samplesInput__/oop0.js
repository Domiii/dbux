function create(title, callback) {
  title = title || ''
  callback = callback || function () {
  }

  var newItem = {
    title: title.trim(),
    completed: false
  }

  callback(newItem);
}

create('title', console.log.bind(console));