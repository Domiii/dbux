/* eslint-disable no-console */
'use strict';

const path = require('path');
const { expect } = require('chai');
const { createSequelizeInstance } = require('./dev/sscce-helpers');
const { Model, DataTypes } = require('.');

class User extends Model { }

async function main() {
  try {
    const sequelize = createSequelizeInstance({
      benchmark: true,
      retry: {
        max: 0
      }
    });
    User.init({
      name: DataTypes.STRING,
      age: DataTypes.INTEGER
    }, { sequelize, modelName: 'user' });
    await sequelize.sync({ force: true });

    // this does not work (AV)
    const [b1, b2] = await Promise.all([
      User.findOrCreate({
        where: { name: "b" },
        defaults: { age: 1 }
      }),
      User.findOrCreate({
        where: { name: "b" },
        defaults: { age: 2 }
      })
    ]);
    console.log(`Result: ${[b1?.[0]?.dataValues?.age, b2?.[0]?.dataValues?.age] || 'undefined'} === 1, 1`);


    await sequelize.close();

    // expect(jane.username).to.equal('janedoe');
  }
  catch (err) {
    console.error('####### FAIL\n\n', err);
    const result = await User.findAll({
      where: { name: "b" }
    });
    console.log('##### RESULT:', result);
  }
}

main();
