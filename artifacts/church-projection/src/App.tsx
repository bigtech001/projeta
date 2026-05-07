import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Operator from "@/pages/operator";
import Projection from "@/pages/projection";
import Stage from "@/pages/stage";
import Liturgy from "@/pages/liturgy";
import Collections from "@/pages/collections";
import Songs from "@/pages/songs";
import Bible from "@/pages/bible";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/operator" component={Operator} />
      <Route path="/projection" component={Projection} />
      <Route path="/stage" component={Stage} />
      <Route path="/liturgy" component={Liturgy} />
      <Route path="/collections" component={Collections} />
      <Route path="/songs" component={Songs} />
      <Route path="/bible" component={Bible} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
