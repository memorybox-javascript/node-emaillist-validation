var dns = require('dns');
var promisify = require('deferred').promisify;
var deferred = require('deferred');
var _ = require('underscore');
var smtp = require('smtp-protocol');


var lookupMx = promisify(dns.resolveMx);
var lookup = promisify(dns.resolve);
var smtpconnect = promisify(smtp.connect);

emails = [
    'working@gmail.com',
    'test@gmail.com',
    'test@google.com',
    'sdf@gmail.com',
    'xczdsfds@asdf.com',
    'xczdsfds@iamthebestthingever.com',
    'agsegas',
    'xczdsfds@hotmail.com'
];

checks = {};
invalid = [];
invalid_hosts = [];

var email_data = _.map(emails, function (email) {
  var lasta = email.lastIndexOf('@');
  var name, host;
  if (lasta != -1) {
    name = email.substring(0, lasta);
    host = email.substring(lasta+1);
    return {'name': name, 'host': host, 'email': email}
  } else {
    invalid.push(email);
  }
})

var host_data = _.reduce(email_data, function (val, email) {
  if (email === undefined) {
    return val;
  }
  if (email['host'] in val) {
    val[email['host']].push(email);
  } else {
    val[email['host']] = [];
    val[email['host']].push(email);
  }
  return val;
}, {});

var print_debug = function(err, code, message) {
  //console.log(message)
}

deferred.map(_.keys(host_data), function(host) {
  return lookupMx(host).catch(function () {
    return lookup(host, 'A').then(function(data) {
      return data[0];
    }).catch(function() {
      invalid_hosts.push(host_data[host]);
    });
  }).then(function(data) {
    if (!_.isUndefined(data)) {
      return {'host': data, 'emails': host_data[host]};
    }
  });
}).map(function(result) {
  if (_.isUndefined(result)) {
    return
  }
  var exchange;
  if (_.isArray(result['host'])) {
    exchange = _.first(_.sortBy(result['host'], 'priority'))['exchange'];
  } else { 
    exchange = result['host']
  }
  var def = deferred();
  var connect = smtp.connect(exchange, 25, function(mail) {
    mail.helo(exchange, print_debug);
    deferred.map(result['emails'], deferred.gate(function(email) {
      var emaildef = deferred();
      console.log('Verifying ' + email['email']);
      mail.from('fake@' + exchange, function(err, code, message) {
        if (code != 250) {
          mail.quit(function () { 
            def.resolve(null, error);
          });
          invalid_hosts.push(result);
        }
      });
      mail.to(email['email'], function(err, code, message) {
        if (code == 250) {
          console.log('Verified ' + email['email']);
          email['valid'] = true;
        } else {
          console.log('Invalid ' + email['email']);
          invalid.push(email['email'])
        }
        mail.reset(function() {
          emaildef.resolve(email['email']);
        });
      });
      return emaildef.promise;
    }, 1)).done(function() {
      mail.quit(function() {
        console.log('Finished ' + exchange);
        def.resolve(exchange);
      });
    }, function(error) {
      def.resolve(null, error);
    })
  });
  connect.setTimeout(20000, function(error) {
    connect.end();
    def.resolve(null, error);
    invalid_hosts.push(result);
  });
  connect.on('error', function(error) {
    def.resolve(null, error);
  });
  return def.promise;
}).done(function(result) {
  console.log(result);
  console.log(host_data);
  console.log(invalid);
  console.log(invalid_hosts);
}, function(error) {
  console.log(error);
})
