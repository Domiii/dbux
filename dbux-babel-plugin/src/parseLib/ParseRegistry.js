import mapValues from 'lodash/mapValues';
import groupBy from 'lodash/groupBy';


class Registry {
  // ParseNodeClassesByName,
  // PluginClassesByName,
  // ParseNodeNamesByPluginName,

  init(ParseNodeClassesByName, PluginClassesByName) {
    this.ParseNodeClassesByName = ParseNodeClassesByName;
    this.PluginClassesByName = PluginClassesByName;

    this.ParseNodeNamesByPluginName = mapValues(
      groupBy(
        Object.entries(ParseNodeClassesByName)
          .flatMap(([nodeName, NodeClazz]) =>
            (NodeClazz.pluginNames || [])
              .map(pluginName => ([pluginName, nodeName]))
          ),
        ([pluginName]) => pluginName
      ),
      group => group.map(([_, nodeName]) => nodeName)
    );
  }

  getParseNodeNamesOfPluginName(pluginName) {
    return this.ParseNodeNamesByPluginName[pluginName];
  }
}


const registry = new Registry();

export default registry;
