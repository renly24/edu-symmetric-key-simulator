import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import SlideDeck from "@/components/SlideDeck";

export default function Home() {
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default", py: { xs: 1.5, sm: 2 } }}>
      <Container maxWidth="lg">
        <Box textAlign="center" mb={1.5}>
          <Typography variant="h5" component="h1" fontWeight={700} sx={{ fontSize: { xs: "1.3rem", sm: "1.6rem" } }}>
            🔑 共通鍵暗号方式のしくみ
          </Typography>
          <Typography variant="body2" color="text.secondary">
            同じ鍵で暗号化して、同じ鍵で復号する。自分で暗号化・復号しながら、しくみと課題を確かめよう
          </Typography>
        </Box>
        <SlideDeck />
      </Container>
    </Box>
  );
}
