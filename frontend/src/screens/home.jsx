import UserContext from "../context/user.context";
import { useContext } from "react";

const Home = () => {
  const { user } = useContext(UserContext);

  return <div>{JSON.stringify(user)}</div>;
};

export default Home;
