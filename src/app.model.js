var mysql = require('mysql');

const DATABASE_HOST = process.env.DATABASE_HOST;
const DATABASE_USER = process.env.DATABASE_USER;
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
const DATABASE_PORT = process.env.DATABASE_PORT;
const DATABASE_NAME = process.env.DATABASE_NAME;
config = {
    host: DATABASE_HOST,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
    port: DATABASE_PORT,
    database: DATABASE_NAME
}

module.exports = {
    createdb: function() {
        var conn = mysql.createConnection(config);
        conn.connect(
            function(err) {
                if (err) {
                    throw err;
                } else {
                    conn.query('CREATE TABLE IF NOT EXISTS users(username TEXT, password TEXT, admin INTEGER)',
                        function(err, results, fields) {
                            if (err) throw err;
                        });
                    conn.query('INSERT INTO users (username, password, admin) ' +
                        'SELECT * from (SELECT "admin" AS username, "admin" AS password, 1) as tmp ' +
                        'WHERE NOT EXISTS (SELECT username FROM users WHERE (username = "admin" and admin=1))',
                        function(err, results, fields) {
                            if (err) throw err;
                        });
                    conn.query('CREATE TABLE IF NOT EXISTS containers_info(http_port INTEGER, ssh_port INTEGER, name TEXT, description TEXT, creator TEXT, gpu_address VARCHAR(15), isOnline INTEGER, PRIMARY KEY (http_port, gpu_address))',
                        function(err, results, fields) {
                            if (err) throw err;
                        });
                    conn.end(function(err) {
                        if (err) throw err;
                    });
                }
            }
        );
    },
    getAllContainers: function(callback) {
        var conn = mysql.createConnection(config);
        conn.connect(
            function(err) {
                if (err) {
                    throw err;
                } else {
                    conn.query('SELECT * FROM containers_info',
                        function(err, results, fields) {
                            if (err) throw err;
                            return callback(results);
                        })
                    conn.end(function(err) {
                        if (err) throw err;
                    });
                }
            }
        );
    },
    getUser: function(username, callback) {
        var conn = mysql.createConnection(config);
        conn.connect(function(err) {
            if (err) {
                throw err;
            }
            conn.query("SELECT * FROM users WHERE username=\'" + String(username) + "\'",
                function(err, results, fields) {
                    if (err) {
                        throw err;
                    } else {
                        return callback(results[0]);
                    }
                });
            conn.end(function(err) {
                if (err) throw err;
            });
        });
    },
    addUser: function(username, password, callback) {
        var conn = mysql.createConnection(config);
        conn.connect(function(err) {
            if (err) {
                throw err;
            }
            conn.query('INSERT INTO users (username, password, admin) VALUES(?, ?, ?)', [username, password, 0],
                function(err, results, fields) {
                    if (err) throw err;
                });
            conn.end(function(err) {
                if (err) throw err;
            });
        });
    },
    deleteUser: function(username) {
        var conn = mysql.createConnection(config);
        conn.connect(function(err) {
            if (err) {
                throw err;
            } else {
                conn.query("DELETE FROM users WHERE username=\'" + username + "\'",
                    function(err, results, fields) {
                        if (err) throw err;
                    })
                conn.end(function(err) {
                    if (err) throw err;
                });
            }
        });
    },
    addContainer: function(params) {
        var conn = mysql.createConnection(config);
        conn.connect(function(err) {
            if (err) {
                throw err;
            } else {
                conn.query("INSERT INTO containers_info(http_port, ssh_port, name, description, creator, gpu_address, isOnline) VALUES(?, ?, ?, ?, ?, ?, ?)",
                            [params["http_port"], params["ssh_port"], params["containerName"], params["containerDes"], params["username"], params["gpu_address"], params["isOnline"]],
                    function(err, results, fields) {
                        if (err) throw err;
                    })
                conn.end(function(err) {
                    if (err) throw err;
                });
            }
        })
    },

    getContainerPorts: function(port, callback) {
        var conn = mysql.createConnection(config);
        var data1;
        var data2;
        conn.connect(function(err) {
            if (err) {
                throw err;
            } else {
                conn.query("SELECT ssh_port FROM containers_info WHERE ssh_port =" + String(port),
                    function(err, results, fields) {
                        if (err) throw err;
                        else data1 = results;
                    })
                conn.query("SELECT http_port FROM containers_info WHERE http_port =" + String(port),
                    function(err, results, fields) {
                        if (err) throw err;
                        else data2 = results;
                    })
                conn.end(function(err) {
                    if (err) throw err;
                });
            }
            return callback({ ssh: data1, http: data2 });
        });
    },
    getContainer: function(containerName, callback) {
        var conn = mysql.createConnection(config);
        conn.connect(function(err) {
            if (err) {
                throw err;
            } else {
                conn.query("SELECT * FROM containers_info WHERE name=\'" + String(containerName) + "\'",
                    function(err, results, fields) {
                        if (err) throw err;
                        return callback(results[0]);
                    })
                conn.end(function(err) {
                    if (err) throw err;
                });
            }
        });
    },
    setContainerOff: function(containerName, gpu, callback) {
      var conn = mysql.createConnection(config);
      conn.connect(function(err) {
          if (err) {
              throw err;
          } else {
              conn.query("UPDATE containers_info SET isOnline = 0 WHERE name = \'" + containerName + "\' AND gpu_address = \'" + gpu + "/'",
                  function(err, results, fields) {
                      if (err) throw err;
                  })
              conn.end(function(err) {
                  if (err) throw err;
              });
          }
      });
    },
    setContainerOn: function(containerName, gpu, callback) {
      var conn = mysql.createConnection(config);
      conn.connect(function(err) {
          if (err) {
              throw err;
          } else {
              conn.query("UPDATE containers_info SET isOnline = 1 WHERE name = \'" + containerName + "\' AND gpu_address = \'" + gpu + "/'",
                  function(err, results, fields) {
                      if (err) throw err;
                  })
              conn.end(function(err) {
                  if (err) throw err;
              });
          }
      });
    },
    deleteContainer: function(containerName) {
        var conn = mysql.createConnection(config);
        conn.connect(function(err) {
            if (err) {
                throw err;
            } else {
                conn.query("DELETE FROM containers_info WHERE name=\'" + containerName + "\'",
                    function(err, results, fields) {
                        if (err) throw err;
                    });
                conn.end(function(err) {
                    if (err) throw err;
                });
            }
        });
    }

};
