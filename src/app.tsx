import Container from "@mui/material/Container";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

import QueueForm from "./components/queue_form";

const App = () => {
  return (
    <Container>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-9">
        <QueueForm />
      </div>
      <footer className="py-3 absolute bottom-0 left-0 right-0 flex items-center justify-between">
        <div></div>
        <span>&copy; 2025 Guillaume RICARD. All rights reserved.</span>
        <div className="mr-5">
          Language select:&nbsp;
          <Select defaultValue="en">
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="ja">日本語</MenuItem>
          </Select>
        </div>
      </footer>
    </Container>
  );
};

export default App;
