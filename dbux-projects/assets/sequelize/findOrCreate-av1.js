/* eslint-disable no-console */
'use strict';

const path = require('path');
const { expect } = require('chai');

const Sequelize = require('.');

const { Model, DataTypes } = Sequelize;


(async () => {
  try {
    const sequelize = new Sequelize('test_db', null, null, {
      dialect: 'sqlite',
      storage: path.join(__dirname, 'test', 'db.sqlite')
    });

    await sequelize.sync({ force: true });

    const User = sequelize.define('user', {
      name: Sequelize.STRING,
      age: Sequelize.INTEGER
    });

    await Promise.all([
      User.findOrCreate({
        where: { name: "John" }, 
        defaults: { age: 47 }
      }),
      User.findOrCreate({
        where: { name: "John" },
        defaults: { age: 111 }
      })
    ])
      .then(function ([john1, john2]) {
        console.log("Result: ", john1, john2);
      });

    await sequelize.close();

    // expect(jane.username).to.equal('janedoe');
  }
  catch (err) {
    console.error('####### FAIL\n\n', err);
  }
})();
