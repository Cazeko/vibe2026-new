// (auth) 그룹은 FitlySignIn 컴포넌트가 자체 layout(좌우 분할)을 가지므로
// 여기서는 children만 통과한다. RootLayout의 ThemeProvider·body 배경은 그대로.
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
