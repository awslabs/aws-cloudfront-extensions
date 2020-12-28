const { http, https } = require('follow-redirects');

http.get('http://bit.ly/900913', response => {
  let content='';
  console.log(response.responseUrl)
  response.on('data', chunk => {
    content += chunk;
  });
  response.on('end', function() {
    console.log(content);
  });
}).on('error', err => {
  console.error(err);
});