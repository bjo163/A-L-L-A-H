"use client";

import { Button, Container, ErrorState } from "@empire/ui";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container>
      <ErrorState
        title="Portal unavailable"
        description="This page could not be rendered. Try again, or return to the portal home."
        action={<Button variant="secondary" onClick={() => reset()}>Try again</Button>}
      />
    </Container>
  );
}
