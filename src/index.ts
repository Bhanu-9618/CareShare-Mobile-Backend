export const hello = async (event: any) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "CareShare Backend Setup is Successful!" }),
  };
};