import React, { useEffect, useRef, useState } from 'react'
import { DefaultTheme, NavigationContainer } from '@react-navigation/native'
import {
  createStackNavigator,
  StackCardInterpolatedStyle,
  StackCardInterpolationProps,
  StackScreenProps,
  TransitionPresets,
} from '@react-navigation/stack'
import styled from 'styled-components/native'
import Animated, {
  Extrapolate,
  interpolate,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import {
  Text,
  Animated as RNAnimated,
  Platform,
  View,
  Dimensions,
  TouchableOpacity,
  Pressable,
} from 'react-native'
import {
  NativeSafeAreaViewProps,
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context'

const WIDTH = Dimensions.get('window').width

const Typography = {
  button: `
    font-weight: 600;
    font-size: 16px;
    line-height: 24px;
  `,
  header: `
    font-size: 28px;
    line-height: 32px;
  `,
}

const Container = styled(SafeAreaView)`
  flex: 1;
  background: #ebf5ff;
  padding: 0 16px;
` as React.ComponentType<NativeSafeAreaViewProps & React.RefAttributes<View>>

const Button = styled.TouchableOpacity`
  height: 64px;
  background: #fff;
  border-radius: 24px;
  justify-content: center;
  align-items: center;
`
const ButtonText = styled.Text`
  ${Typography.button}
`
const AnimatedButtonText = styled(Animated.Text)`
  ${Typography.button}
`

const Handle = styled.View`
  width: 50px;
  height: 5px;
  background: #181818;
  opacity: 0.2;
  border-radius: 2.5px;
  align-self: center;
  margin: 10px 0 25px;
`

const Header = styled(Animated.createAnimatedComponent(Pressable))`
  position: absolute;
  overflow: hidden;
  z-index: 1;
  top: 40px;
  left: 16px;
  width: 100%;
  background: #ebf5ff;
`

type BlockProps = { width?: number; height: number; marginBottom?: number }

const Block = styled.View<BlockProps>`
  background: #fff;
  opacity: 0.8;
  border-radius: 10px;
  margin-bottom: ${props => props.marginBottom || 24}px;
  height: ${props => props.height}px;
  ${props => props.width && `width: ${props.width}px;`}
`

type HeaderRowProps = { top?: number; width: number; height: number }

const HeaderRow = styled(Animated.View)<HeaderRowProps>`
  position: absolute;
  left: 8px;
  ${props => props.top && `top: ${props.top}px;`}
  background: #fff;
  border-radius: 10px;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
`

const HeaderText = styled(Animated.Text)`
  ${Typography.header}
  position: absolute;
  top: 44px;
  left: 8px;
`

const Separator = styled.View`
  position: absolute;
  bottom: 0;
  left: 0px;
  right: 0px;
  background: #8bb2e2;
  border-radius: 1px;
  height: 2px;
`

type ScrollViewProps = { extraPadding: number }

const ScrollView = styled(Animated.ScrollView).attrs<ScrollViewProps>(
  props => ({
    contentContainerStyle: {
      paddingTop: 32 + props.extraPadding,
      paddingBottom: 8,
      paddingHorizontal: 8,
    },
  }),
)<ScrollViewProps>`
  flex: 1;
`

const Bids = styled(Animated.createAnimatedComponent(TouchableOpacity))`
  height: 64px;
  background: #fff;
  border-radius: 24px;
  position: absolute;
  z-index: 1;
  bottom: 42px;
  left: 24px;
  right: 24px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  ${Platform.OS === 'android' && 'shadow-color: rgba(0, 0, 0, 0.4)'}
  elevation: 5;
`

type StackParamList = {
  Home: undefined
  Order: undefined
}

const Stack = createStackNavigator<StackParamList>()

const Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: 'black' },
}

const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={Theme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen
            name="Order"
            component={Order}
            options={{
              ...TransitionPresets.ModalPresentationIOS,
              cardStyleInterpolator: forModalPresentation,
              detachPreviousScreen: true,
              cardStyle: { borderTopLeftRadius: 28, borderTopRightRadius: 28 },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}

const Home: React.FC<StackScreenProps<StackParamList, 'Home'>> = ({
  navigation,
}) => {
  return (
    <Container>
      <Button onPress={() => navigation.navigate('Order')}>
        <ButtonText>Заказ</ButtonText>
      </Button>
    </Container>
  )
}

const SpringConfig = {
  damping: 14,
  stiffness: 80,
  restSpeedThreshold: 0.01,
}

const Order: React.FC<StackScreenProps<StackParamList, 'Order'>> = () => {
  const containerRef = useRef<View>(null)
  const textRef = useAnimatedRef<Animated.Text>()
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>()

  const [textHeight, setTextHeight] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [bidsShown, setBidsShown] = useState(false)

  const scrollY = useSharedValue(0)
  const lastScrollY = useSharedValue(0)
  const bidsExpansion = useSharedValue(0)

  const headerHeight = textHeight + 28 + 16 + 8 + 24 + 24

  useEffect(() => {
    ;(textRef.current as Text | null)?.measure((x, y, w, h) => setTextHeight(h))
    ;(containerRef.current as View | null)?.measure((x, y, w, h) =>
      setContainerHeight(h),
    )
  }, [textRef])

  useEffect(() => {
    if (bidsShown) lastScrollY.value = scrollY.value
    bidsExpansion.value = withSpring(bidsShown ? 1 : 0, SpringConfig)
  }, [bidsShown, bidsExpansion, scrollY, lastScrollY])

  const scrollHandler = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y
  })

  const headerStyle = useAnimatedStyle(() => {
    if (textHeight === 0) return {}
    return {
      height: interpolate(
        scrollY.value,
        [0, headerHeight - 45],
        [headerHeight, 45],
        Extrapolate.CLAMP,
      ),
    }
  }, [headerHeight])

  const [firstBlockStyle, secondBlockStyle] = Array(2)
    .fill('')
    .map(() =>
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useAnimatedStyle(() => {
        if (textHeight === 0) return {}
        return {
          opacity: interpolate(
            scrollY.value,
            [0, (headerHeight - 45) / 2],
            [0.8, 0],
            Extrapolate.CLAMP,
          ),
          transform: [{ translateY: -scrollY.value / 4 }],
        }
      }, [headerHeight]),
    )

  const textStyle = useAnimatedStyle(() => {
    if (textHeight === 0) return {}
    return {
      fontSize: interpolate(
        scrollY.value,
        [0, headerHeight - 45],
        [28, 16],
        Extrapolate.CLAMP,
      ),
      lineHeight: interpolate(
        scrollY.value,
        [0, headerHeight - 45],
        [32, 20],
        Extrapolate.CLAMP,
      ),
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [0, headerHeight - 45],
            [0, -44],
            Extrapolate.CLAMP,
          ),
        },
      ],
    }
  }, [headerHeight])

  const bidsStyle = useAnimatedStyle(() => {
    const scrollToValue = interpolate(
      bidsExpansion.value,
      [0, 1],
      [lastScrollY.value, 0],
    )
    scrollTo(scrollViewRef, 0, scrollToValue, false)

    return {
      left: interpolate(bidsExpansion.value, [0, 1], [24, 0]),
      right: interpolate(bidsExpansion.value, [0, 1], [24, 0]),
      bottom: interpolate(bidsExpansion.value, [0, 1], [42, 0]),
      borderRadius: interpolate(bidsExpansion.value, [0, 1], [24, 0]),
      height: interpolate(
        bidsExpansion.value,
        [0, 1],
        [64, containerHeight - headerHeight - 38],
      ),
      shadowOpacity: interpolate(bidsExpansion.value, [0, 1], [1, 0]),
    }
  }, [headerHeight, containerHeight])

  const bidTextStyle = useAnimatedStyle(() => {
    const startLeft = (WIDTH - 48 - 65) / 2
    return {
      position: 'absolute',
      top: interpolate(bidsExpansion.value, [0, 1], [20, 24]),
      left: interpolate(bidsExpansion.value, [0, 1], [startLeft, 24]),
      transform: [
        { scale: interpolate(bidsExpansion.value, [0, 1], [1, 1.5]) },
      ],
      // fontSize: interpolate(bidsExpansion.value, [0, 1], [16, 24]),
      // lineHeight: interpolate(bidsExpantion.value, [0, 1], [24, 28]),
    }
  }, [])

  return (
    <Container edges={['bottom']} ref={containerRef}>
      <Handle />
      <Header style={headerStyle} onPress={() => setBidsShown(false)}>
        <HeaderRow style={firstBlockStyle} width={139} height={28} />
        <HeaderText ref={textRef} style={textStyle}>
          Репетитор по математике
        </HeaderText>
        <HeaderRow
          width={161}
          height={24}
          top={textHeight + 28 + 16 + 8}
          style={secondBlockStyle}
        />
        <Separator />
      </Header>

      <ScrollView
        ref={scrollViewRef}
        scrollEventThrottle={1}
        onScroll={scrollHandler}
        extraPadding={headerHeight}
        showsVerticalScrollIndicator={false}
      >
        <Block width={161} height={16} marginBottom={8} />
        <Block height={66} />
        <Block width={161} height={16} marginBottom={8} />
        <Block height={66} />
        <Block width={161} height={16} marginBottom={8} />
        <Block height={66} />
        <Block width={161} height={16} marginBottom={8} />
        <Block height={66} />
        <Block width={161} height={16} marginBottom={8} />
        <Block height={66} />
        <Block width={161} height={16} marginBottom={8} />
        <Block height={66} />
        <Block width={161} height={16} marginBottom={8} />
        <Block height={66} />
        <Block width={161} height={16} marginBottom={8} />
        <Block height={66} />
        <Block width={161} height={16} marginBottom={8} />
        <Block height={66} />
        <Block width={161} height={16} marginBottom={8} />
        <Block height={66} />
        <Block width={161} height={16} marginBottom={8} />
        <Block height={66} />
      </ScrollView>

      <Bids
        style={bidsStyle}
        onPress={() => setBidsShown(true)}
        disabled={bidsShown}
      >
        <AnimatedButtonText style={bidTextStyle}>Отклики</AnimatedButtonText>
      </Bids>
    </Container>
  )
}

type ScreenInterpolator = (
  props: StackCardInterpolationProps,
) => StackCardInterpolatedStyle

const forModalPresentation: ScreenInterpolator = ({
  index,
  current,
  next,
  inverted,
  layouts: { screen },
  insets,
}) => {
  const hasNotchIos =
    Platform.OS === 'ios' &&
    !Platform.isPad &&
    !Platform.isTVOS &&
    insets.top > 20
  const isLandscape = screen.width > screen.height
  const topOffset = isLandscape ? 0 : 10
  const statusBarHeight = insets.top
  const aspectRatio = screen.height / screen.width

  const progress = RNAnimated.add(
    current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
    next
      ? next.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        })
      : 0,
  )

  const isFirst = index === 0

  const translateY = RNAnimated.multiply(
    progress.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [
        screen.height,
        isFirst ? 0 : topOffset,
        isFirst ? statusBarHeight : -topOffset * aspectRatio,
      ],
    }),
    inverted,
  )

  const overlayOpacity = progress.interpolate({
    inputRange: [0, 1, 1.0001, 2],
    outputRange: [0, 0.3, 1, 1],
  })

  const scale = isLandscape
    ? 1
    : progress.interpolate({
        inputRange: [0, 1, 2],
        outputRange: [
          1,
          1,
          screen.width ? 1 - (topOffset * 2) / screen.width : 1,
        ],
      })

  const borderRadius = isLandscape
    ? 0
    : isFirst
    ? progress.interpolate({
        inputRange: [0, 1, 1.0001, 2],
        outputRange: [0, 0, hasNotchIos ? 38 : 0, 10],
      })
    : 10

  return {
    cardStyle: {
      overflow: 'hidden',
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
      borderBottomLeftRadius: hasNotchIos ? borderRadius : 0,
      borderBottomRightRadius: hasNotchIos ? borderRadius : 0,
      marginTop: isFirst ? 0 : statusBarHeight,
      marginBottom: isFirst ? 0 : topOffset,
      transform: [{ translateY }, { scale }],
    },
    overlayStyle: { opacity: overlayOpacity },
  }
}

export default App
