import cmp from "../util/cmp";

function makeLevelList(levelPropertiesList, LevelClass) {
  var list: any[] = [];

  for (var i = 0; i < levelPropertiesList.length; i++) {
    list.push(new LevelClass(levelPropertiesList[i]));
  }

  list.sort(function(level1, level2) {
    return cmp(level1.width(), level2.width());
  });

  return list;
}

function makeSelectableLevelList(levelList) {
  var list: any[] = [];

  for (var i = 0; i < levelList.length; i++) {
    if (!levelList[i]._fallbackOnly) {
      list.push(levelList[i]);
    }
  }

  if (!list.length) {
    throw new Error('No selectable levels in list');
  }

  return list;
}

// TODO: restructure these imports
export {
  makeLevelList,
  makeSelectableLevelList
};

export default {
  makeLevelList: makeLevelList,
  makeSelectableLevelList: makeSelectableLevelList
};
