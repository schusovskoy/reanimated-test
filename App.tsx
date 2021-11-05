import React, { useEffect, useState } from 'react'
import styled from 'styled-components/native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

const Container = styled.View`
  flex: 1;
  background: #fff;
  padding: 0 16px;
`

const Button = styled.TouchableOpacity`
  position: absolute;
  bottom: 32px;
  height: 64px;
  width: 100%;
  left: 16px;
  background: #fff;
  border-radius: 24px;
  justify-content: center;
  align-items: center;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
`
const ButtonText = styled.Text`
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
`

const App = () => {
  const value = useSharedValue(0)
  const [state, setState] = useState(false)

  useEffect(() => {
    value.value = withSpring(state ? 1 : 0)
  }, [state, value])

  const style = useAnimatedStyle(() => {
    return {
      fontSize: interpolate(value.value, [0, 1], [28, 16]),
    }
  })

  return (
    <Container>
      <Animated.Text style={[{ marginTop: 100 }, style]}>
        Some text
      </Animated.Text>
      <Button onPress={() => setState(!state)}>
        <ButtonText>Press me</ButtonText>
      </Button>
    </Container>
  )
}

export default App
