/* eslint-disable no-console */
'use strict';

const path = require('path');
const { expect } = require('chai');

const Sequelize = require('.');

const { Model, DataTypes } = Sequelize;


class User extends Model { }

(async () => {
  try {
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, 'tmp', 'db.sqlite')
    });
    User.init({
      name: DataTypes.STRING,
      age: DataTypes.INTEGER,
    }, { sequelize, modelName: 'user' });

    await sequelize.sync({ force: true });

    await Promise.all([
      User.findOrCreate({ name: "John" }, { age: 47 }),
      User.findOrCreate({ name: "John" }, { age: 49 })
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
