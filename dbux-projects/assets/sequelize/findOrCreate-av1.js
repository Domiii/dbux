/* eslint-disable no-console */
'use strict';

const { expect } = require('chai');
const { createSequelizeInstance } = require('./dev/sscce-helpers');
const { Model, DataTypes } = require('.');

const sequelize = createSequelizeInstance({ benchmark: true });

class User extends Model { }
User.init({
  name: DataTypes.STRING,
  age: DataTypes.INTEGER,
}, { sequelize, modelName: 'user' });

(async () => {
  try {
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
