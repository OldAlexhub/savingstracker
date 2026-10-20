import {useNavigation, usePreventRemove} from '@react-navigation/native';
import {Alert} from 'react-native';

export function useUnsavedChanges(shouldPrevent: boolean): void {
  const navigation = useNavigation();

  usePreventRemove(shouldPrevent, ({data}) => {
    Alert.alert(
      'Discard unsaved changes?',
      'Your edits have not been saved.',
      [
        {text: 'Keep editing', style: 'cancel'},
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.dispatch(data.action),
        },
      ],
    );
  });
}
