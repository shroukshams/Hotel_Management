using System;
using System.Collections.Generic;
using System.Text;

namespace Hotel.DataAccess.Models
{
    public class BaseEntity<T>
    {
       public T  Id { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
       
    }
}
