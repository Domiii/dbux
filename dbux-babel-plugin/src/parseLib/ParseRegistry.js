import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
// import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { getAllStaticPropsInInheritanceChain } from '@dbux/common/src/util/oopUtil';
import NestedError from '@dbux/common/src/NestedError';


class Registry {
  ParseNodeClassesByName;
  PluginClassesByName;
  // ParseNodeNamesByPluginName;

  init(ParseNodeClassesByName, PluginClassesByName) {
    this.ParseNodeClassesByName = ParseNodeClassesByName;
    this.PluginClassesByName = PluginClassesByName;

    // this.ParseNodeNamesByPluginName = mapValues(
    //   groupBy(
    //     Object.entries(ParseNodeClassesByName)
    //       .flatMap(([nodeName, NodeClazz]) => {
    //         const allPluginConfigs = this.getAllPluginConfigsOfNodeClass(NodeClazz);
    //         return Array.from(allPluginConfigs.keys())
    //           .map(pluginName => ([pluginName, nodeName]));
    //       }),
    //     ([pluginName]) => pluginName
    //   ),
    //   group => group.map(([_, nodeName]) => nodeName)
    // );
  }

  // getParseNodeNamesOfPluginName(pluginName) {
  //   return this.ParseNodeNamesByPluginName[pluginName];
  // }

  getPluginClassByName(plugin) {
    const { PluginClassesByName } = this;
    const PluginClazz = PluginClassesByName[plugin];
    return PluginClazz;
  }

  /**
   * Lookup all plugin dependencies recursively.
   * @param {Map?} rootMap
   * 
   * @return {Map}
   */
  getAllPluginConfigsOfNodeClass(NodeClazz, requester) {
    // return this._getAllPluginConfigsOfClass(NodeClazz, new Set(), requester);
    return this._getAllPluginConfigs(NodeClazz, new Set(), requester);
  }

  // NOTE: we cannot cache this anymore (since we have dynamic plugin creator functions now)
  // _getAllPluginConfigsOfClass(NodeOrPluginClazz, visited, requester) {
  //   if (!NodeOrPluginClazz._allPluginConfigs) {
  //     NodeOrPluginClazz._allPluginConfigs = this._getAllPluginConfigs(NodeOrPluginClazz, visited, requester);
  //   }
  //   return NodeOrPluginClazz._allPluginConfigs;
  // }

  _getAllPluginConfigs(Clazz, visited, requester) {
    const pluginMap = new Map();
    if (visited.has(Clazz)) {
      throw new Error(`Cyclic plugin dependency: ${Clazz.name}`);
    }
    visited.add(Clazz);

    const pluginNames = getAllStaticPropsInInheritanceChain(Clazz, 'plugins').flat();

    for (const _pluginCfg of pluginNames) {
      let name;
      let pluginCfg = _pluginCfg;
      if (isFunction(pluginCfg)) {
        pluginCfg = pluginCfg(requester);
        if (!pluginCfg) {
          // ignore
          continue;
        }
      }
      if (isString(pluginCfg)) {
        name = pluginCfg;
      }
      else {
        throw new Error(`Invalid plugin - must be string or function returning string but was "${toString(pluginCfg)}" in ${this}`);
      }

      // NOTE: currently, there is no configuration needed for the plugin
      name = pluginCfg;

      try {
        const PluginClazz = this.getPluginClassByName(name);
        if (!PluginClazz) {
          throw new Error(`ParseNode "${Clazz.name}" referenced non-existing pluginName = "${name}" (available: ${Object.keys(this.PluginClassesByName).join(', ')})`);
        }
        pluginMap.set(name, PluginClazz);
        const pluginConfigs = this._getAllPluginConfigs(PluginClazz, visited, requester);

        // add children plugins to this pluginMap
        for (const [key, value] of pluginConfigs.entries()) {
          pluginMap.set(key, value);
        }
      }
      catch (err) {
        throw new NestedError(`ParseRegistry.getAllPluginConfigs failed to resolve dependency ${Clazz.name} -> ${name}`, err);
      }
    }
    return pluginMap;
  }
}


const registry = new Registry();

export default registry;
