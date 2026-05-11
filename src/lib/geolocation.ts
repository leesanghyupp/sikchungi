export type Coords = { lat: number; lng: number };

export class GeolocationError extends Error {
  constructor(
    public readonly kind: "unsupported" | "denied" | "unavailable" | "timeout",
    message: string
  ) {
    super(message);
  }
}

export const getCurrentCoords = (): Promise<Coords> => {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(
        new GeolocationError("unsupported", "geolocation not supported")
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const kind =
          err.code === err.PERMISSION_DENIED
            ? "denied"
            : err.code === err.POSITION_UNAVAILABLE
              ? "unavailable"
              : "timeout";
        reject(new GeolocationError(kind, err.message));
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
    );
  });
};
