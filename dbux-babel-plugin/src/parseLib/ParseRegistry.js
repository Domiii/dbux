import mapValues from 'lodash/mapValues';
import groupBy from 'lodash/groupBy';
import EmptyArray from '@dbux/common/src/util/EmptyArray';


class Registry {
  ParseNodeClassesByName;
  PluginClassesByName;
  ParseNodeNamesByPluginName;

  init(ParseNodeClassesByName, PluginClassesByName) {
    this.ParseNodeClassesByName = ParseNodeClassesByName;
    this.PluginClassesByName = PluginClassesByName;

    this.ParseNodeNamesByPluginName = mapValues(
      groupBy(
        Object.entries(ParseNodeClassesByName)
          .flatMap(([nodeName, NodeClazz]) => {
            const allPluginConfigs = this.getAllPluginConfigsOfNodeClass(NodeClazz.plugins);
            return allPluginConfigs
              .keys()
              .map(pluginName => ([pluginName, nodeName]));
          }),
        ([pluginName]) => pluginName
      ),
      group => group.map(([_, nodeName]) => nodeName)
    );
  }

  getParseNodeNamesOfPluginName(pluginName) {
    return this.ParseNodeNamesByPluginName[pluginName];
  }

  getPluginClassByName(plugin) {
    const { PluginClassesByName } = this;
    const PluginClazz = PluginClassesByName[plugin];
    if (!PluginClazz) {
      throw new Error(`ParseNode "${this}" referenced non-existing pluginName = "${plugin}" (available: ${Object.keys(PluginClassesByName).join(', ')})`);
    }
    return PluginClazz;
  }

  /**
   * Lookup all plugin dependencies recursively.
   * @param {Map?} allPluginConfigs
   * 
   * @return {Map}
   */
  getAllPluginConfigsOfNodeClass(NodeClazz) {
    if (!NodeClazz._allPluginConfigs) {
      NodeClazz._allPluginConfigs = this._getAllPluginConfigs(NodeClazz.plugins);
    }
    return NodeClazz._allPluginConfigs;
  }

  _getAllPluginConfigs(inputNames, allPluginConfigs = null) {
    allPluginConfigs = allPluginConfigs || new Map();

    for (const pluginCfg of (inputNames || EmptyArray)) {
      let name;
      if (Array.isArray(pluginCfg)) {
        [, name] = pluginCfg;
      }
      else {
        name = pluginCfg;
      }
      if (!allPluginConfigs.has(name)) {
        allPluginConfigs.set(name, pluginCfg);

        const Clazz = this.getPluginClassByName(name);
        this.getAllPluginConfigsOfNodeClass(Clazz.plugins, allPluginConfigs);
      }
    }
    return allPluginConfigs;
  }
}


const registry = new Registry();

export default registry;
